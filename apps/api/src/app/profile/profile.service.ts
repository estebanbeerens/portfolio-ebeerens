import { Injectable, NotFoundException } from '@nestjs/common';
import { Profile } from '../../generated/prisma/client';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import { MarkdownRenderService } from '../shared/markdown-render.service';
import { ProfileDto } from './dto/profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PublicPortfolioDto } from './dto/public-portfolio.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly markdown: MarkdownRenderService
  ) {}

  async findProfile() {
    const profile = await this.prisma.profile.findFirst();
    if (!profile) {
      throw new NotFoundException('Profile has not been created yet');
    }
    return this.toDto(profile);
  }

  async findPublicPortfolio(): Promise<PublicPortfolioDto> {
    const [profile, roles, projects, featureFlags] = await Promise.all([
      this.prisma.profile.findFirst(),
      this.prisma.role.findMany({
        orderBy: { startDate: 'desc' },
        include: { organization: true, skills: true },
      }),
      this.prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        include: { skills: true },
      }),
      this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } }),
    ]);

    return {
      profile: profile
        ? { ...this.toDto(profile), bioHtml: profile.bio ? this.markdown.render(profile.bio) : undefined }
        : undefined,
      roles: roles.map((role) => {
        const { description, ...rest } = role;
        return description === null
          ? rest
          : { ...rest, description, descriptionHtml: this.markdown.render(description) };
      }),
      projects: projects.map((project) => ({
        ...project,
        descriptionHtml: this.markdown.render(project.description),
      })),
      featureFlags,
    };
  }

  // There is only ever one administrator/profile row, so PUT upserts it.
  async upsertProfile(dto: UpdateProfileDto, actor?: string) {
    const existing = await this.prisma.profile.findFirst();
    const data = this.toPersistenceData(dto);
    const profile = existing
      ? await this.prisma.profile.update({ where: { id: existing.id }, data })
      : await this.prisma.profile.create({ data });

    await this.activity.record({
      entityType: 'PROFILE',
      action: existing ? 'UPDATED' : 'CREATED',
      entityId: profile.id,
      summary: existing ? 'Updated profile details' : 'Created the profile',
      actor,
    });
    return this.toDto(profile);
  }

  private toPersistenceData(dto: UpdateProfileDto) {
    return {
      name: dto.name,
      headline: dto.headline || null,
      bio: dto.bio?.trim() ? dto.bio : null,
      avatarUrl: dto.avatarUrl || null,
      location: dto.location || null,
      linkedinUrl: dto.linkedinUrl || null,
      githubUrl: dto.githubUrl || null,
      instagramUrl: dto.instagramUrl || null,
      xUrl: dto.xUrl || null,
      youtubeUrl: dto.youtubeUrl || null,
    };
  }

  private toDto(profile: Profile): ProfileDto {
    return {
      id: profile.id,
      name: profile.name,
      headline: profile.headline ?? undefined,
      bio: profile.bio ?? undefined,
      avatarUrl: profile.avatarUrl ?? undefined,
      location: profile.location ?? undefined,
      linkedinUrl: profile.linkedinUrl ?? undefined,
      githubUrl: profile.githubUrl ?? undefined,
      instagramUrl: profile.instagramUrl ?? undefined,
      xUrl: profile.xUrl ?? undefined,
      youtubeUrl: profile.youtubeUrl ?? undefined,
      updatedAt: profile.updatedAt,
    };
  }
}
