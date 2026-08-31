import { Injectable, NotFoundException } from '@nestjs/common';
import { Profile } from '../../generated/prisma/client';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma.service';
import { Locale } from '../shared/locale.util';
import { MarkdownRenderService } from '../shared/markdown-render.service';
import { toPublicProject, toPublicRole } from '../shared/public-content.util';
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

  async findPublicPortfolio(locale: Locale = 'en'): Promise<PublicPortfolioDto> {
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
      profile: profile ? this.toPublicProfileDto(profile, locale) : undefined,
      roles: roles.map((role) => toPublicRole(role, locale, this.markdown)),
      projects: projects.map((project) => toPublicProject(project, locale, this.markdown)),
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
      bioEn: dto.bioEn?.trim() ? dto.bioEn : null,
      bioNl: dto.bioNl?.trim() ? dto.bioNl : null,
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
      bioEn: profile.bioEn ?? undefined,
      bioNl: profile.bioNl ?? undefined,
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

  private toPublicProfileDto(profile: Profile, locale: Locale) {
    const { bioEn, bioNl, ...rest } = this.toDto(profile);
    const bio = locale === 'nl' ? bioNl : bioEn;
    return { ...rest, bio, bioHtml: bio ? this.markdown.render(bio) : undefined };
  }
}
