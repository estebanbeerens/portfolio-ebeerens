import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService
  ) {}

  findAll() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { skills: true },
    });
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

  async create(dto: CreateProjectDto, actor?: string) {
    const { skills, description, ...rest } = dto;
    try {
      const project = await this.prisma.project.create({
        data: {
          ...rest,
          description: description as Prisma.InputJsonValue,
          skills: this.buildSkillsInput(skills),
        },
        include: { skills: true },
      });
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
    await this.findOne(id);
    const { skills, description, ...rest } = dto;
    try {
      const project = await this.prisma.project.update({
        where: { id },
        data: {
          ...rest,
          description: description as Prisma.InputJsonValue | undefined,
          skills: skills ? { set: [], ...this.buildSkillsInput(skills) } : undefined,
        },
        include: { skills: true },
      });
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
    await this.activity.record({
      entityType: 'PROJECT',
      action: 'DELETED',
      summary: `Deleted project "${project.title}"`,
      actor,
    });
  }

  // Reuses existing skills by name, creating new ones as needed.
  private buildSkillsInput(skills?: string[]) {
    if (!skills) {
      return undefined;
    }
    return {
      connectOrCreate: skills.map((name) => ({
        where: { name },
        create: { name },
      })),
    };
  }

  private mapPrismaError(error: unknown, slug?: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException(`A project with slug "${slug}" already exists`);
    }
    return error;
  }
}
