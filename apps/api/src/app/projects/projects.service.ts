import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import { Locale } from '../shared/locale.util';
import { MarkdownRenderService } from '../shared/markdown-render.service';
import { toPublicProject } from '../shared/public-content.util';
import { ImageDerivativesService } from '../storage/image-derivatives.service';
import { R2Service } from '../storage/r2.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateProjectImageUploadUrlDto } from './dto/create-project-image-upload-url.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly r2: R2Service,
    private readonly derivatives: ImageDerivativesService,
    private readonly markdown: MarkdownRenderService
  ) {}

  private get imagesBucket(): string {
    return process.env.R2_IMAGES_BUCKET as string;
  }

  async createImageUploadUrl(dto: CreateProjectImageUploadUrlDto) {
    const extension = dto.mimeType.split('/')[1];
    const objectKey = `projects/${randomUUID()}.${extension}`;
    const uploadUrl = await this.r2.presignPut(this.imagesBucket, objectKey, dto.mimeType, dto.fileSize);
    const publicUrl = `${process.env.R2_PUBLIC_BASE_URL}/${objectKey}`;
    return { uploadUrl, objectKey, publicUrl };
  }

  findAll() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { skills: true },
    });
  }

  async findPublicAll(locale: Locale = 'en') {
    const projects = await this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { skills: true },
    });

    return [...projects]
      .sort((a, b) => recencyValue(b) - recencyValue(a))
      .map((project) => toPublicProject(project, locale, this.markdown));
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { skills: true },
    });
    if (!project) {
      throw new NotFoundException(`Project "${id}" not found`);
    }
    return project;
  }

  // Ranks by shared-skill count then recency, padding with other recent projects if too few overlap.
  async findRelated(id: string, limit = 3, locale: Locale = 'en') {
    const project = await this.findOne(id);
    const skillIds = new Set(project.skills.map((skill) => skill.id));

    const others = await this.prisma.project.findMany({
      where: { id: { not: id } },
      orderBy: { createdAt: 'desc' },
      include: { skills: true },
    });

    const ranked = [...others].sort((a, b) => {
      const overlapDiff = sharedSkillCount(b, skillIds) - sharedSkillCount(a, skillIds);
      if (overlapDiff !== 0) {
        return overlapDiff;
      }
      return recencyValue(b) - recencyValue(a);
    });

    return ranked.slice(0, limit).map((related) => toPublicProject(related, locale, this.markdown));
  }

  async create(dto: CreateProjectDto, actor?: string) {
    const { skills, startDate, endDate, ...rest } = dto;
    try {
      const project = await this.prisma.project.create({
        data: {
          ...rest,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : undefined,
          skills: this.buildSkillsInput(skills),
        },
        include: { skills: true },
      });
      if (project.imageObjectKey) {
        await this.derivatives.generate(this.imagesBucket, project.imageObjectKey);
      }
      await this.activity.record({
        entityType: 'PROJECT',
        action: 'CREATED',
        entityId: project.id,
        summary: `Added project "${project.title}"`,
        actor,
      });
      return project;
    } catch (error) {
      throw this.mapPrismaError(error, dto.slug);
    }
  }

  async update(id: string, dto: UpdateProjectDto, actor?: string) {
    const existing = await this.findOne(id);
    const { skills, startDate, endDate, ...rest } = dto;
    try {
      const project = await this.prisma.project.update({
        where: { id },
        data: {
          ...rest,
          // Cleared optional fields are omitted by the client, so null them explicitly rather than leaving them unchanged.
          imageUrl: rest.imageUrl || null,
          // `imageObjectKey` isn't exposed on ProjectDto (it's an internal R2 detail), so the client can only ever
          // send a *new* key from a fresh upload. When the image is unchanged, keep the object key we already have.
          imageObjectKey: rest.imageUrl ? (rest.imageObjectKey ?? existing.imageObjectKey) : null,
          client: rest.client || null,
          jobRole: rest.jobRole || null,
          liveUrl: rest.liveUrl || null,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : null,
          skills: skills ? { set: [], ...this.buildSkillsInput(skills) } : undefined,
        },
        include: { skills: true },
      });
      if (existing.imageObjectKey && existing.imageObjectKey !== project.imageObjectKey) {
        await this.deleteImageObject(existing.imageObjectKey);
      }
      if (project.imageObjectKey && project.imageObjectKey !== existing.imageObjectKey) {
        await this.derivatives.generate(this.imagesBucket, project.imageObjectKey);
      }
      await this.activity.record({
        entityType: 'PROJECT',
        action: 'UPDATED',
        entityId: project.id,
        summary: `Updated project "${project.title}"`,
        actor,
      });
      return project;
    } catch (error) {
      throw this.mapPrismaError(error, dto.slug);
    }
  }

  async remove(id: string, actor?: string) {
    const project = await this.findOne(id);
    await this.prisma.project.delete({ where: { id } });
    if (project.imageObjectKey) {
      await this.deleteImageObject(project.imageObjectKey);
    }
    await this.activity.record({
      entityType: 'PROJECT',
      action: 'DELETED',
      summary: `Deleted project "${project.title}"`,
      actor,
    });
  }

  // Best-effort: an R2 delete failure shouldn't fail an otherwise-successful project mutation.
  private async deleteImageObject(objectKey: string): Promise<void> {
    if (!this.r2.isConfigured) {
      return;
    }
    try {
      await this.r2.deleteObject(this.imagesBucket, objectKey);
    } catch (error) {
      this.logger.warn(`Failed to delete stale project image "${objectKey}" from R2: ${error}`);
    }
    await this.derivatives.delete(this.imagesBucket, objectKey);
  }

  // Reuses existing skills by name (case-insensitively normalized), creating new ones as needed.
  private buildSkillsInput(skills?: string[]) {
    if (!skills) {
      return undefined;
    }
    return {
      connectOrCreate: skills.map((skill) => {
        const name = skill.trim().toLowerCase();
        return { where: { name }, create: { name } };
      }),
    };
  }

  private mapPrismaError(error: unknown, slug?: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(`A project with slug "${slug}" already exists`);
    }
    return error;
  }
}

interface RankableProject {
  skills: { id: string }[];
  createdAt: Date;
  startDate: Date;
  endDate?: Date | null;
}

function sharedSkillCount(project: RankableProject, skillIds: Set<string>): number {
  return project.skills.filter((skill) => skillIds.has(skill.id)).length;
}

function recencyValue(project: RankableProject): number {
  return (project.endDate ?? project.startDate).getTime();
}
