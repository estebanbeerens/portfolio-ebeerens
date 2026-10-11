import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma.service';
import { Locale } from '../shared/locale.util';

export interface CvEntry {
  heading: string;
  organization?: string;
  employerId?: string;
  pageUrl?: string;
  period: string;
  details?: string;
  description?: string;
  skills: string[];
  url?: string;
}

export interface CvContent {
  locale: Locale;
  name: string;
  headline?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  links: { label: string; url: string }[];
  roles: CvEntry[];
  education: CvEntry[];
  projects: CvEntry[];
  skills: { name: string; skills: string[] }[];
}

export function fingerprint(content: CvContent): string {
  return createHash('sha256')
    .update(JSON.stringify({ template: 'cv-v10-skills-before-experience-pdfmake-0.2.20-roboto', content }))
    .digest('hex');
}

@Injectable()
export class ResumeContentService {
  constructor(private readonly prisma: PrismaService) {}

  async snapshot(locale: Locale, preview = false): Promise<CvContent> {
    return this.prisma.$transaction(
      async (transaction) => {
        const [profile, flags, roles, education, projects] = await Promise.all([
          transaction.profile.findFirst(),
          transaction.featureFlag.findMany(),
          transaction.role.findMany({
            orderBy: [{ startDate: 'desc' }, { id: 'asc' }],
            include: { organization: true, skills: { include: { category: true } } },
          }),
          transaction.education.findMany({
            orderBy: [{ startDate: 'desc' }, { id: 'asc' }],
            include: { institution: true },
          }),
          transaction.project.findMany({
            where: { isCvFeatured: true },
            orderBy: [{ startDate: 'desc' }, { id: 'asc' }],
            include: { skills: { include: { category: true } } },
          }),
        ]);
        const enabled = (key: string) => flags.some((flag) => flag.key === key && flag.enabled);
        if (!profile || (!preview && !enabled('RESUME'))) {
          throw new NotFoundException('CV unavailable');
        }
        const localized = (english?: string | null, dutch?: string | null) =>
          (locale === 'nl' ? dutch?.trim() || english : english) || undefined;
        const dateFormat = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' });
        const period = (start: Date, end: Date | null) =>
          `${dateFormat.format(start)} - ${end ? dateFormat.format(end) : locale === 'nl' ? 'heden' : 'present'}`;
        const names = (skills: { name: string }[]) => [...new Set(skills.map((skill) => skill.name))].sort();
        const publicRoles: CvEntry[] = enabled('ROLES')
          ? roles.map((role) => ({
              heading: role.jobTitle,
              organization: role.organization.name,
              employerId: role.organizationId,
              period: period(role.startDate, role.endDate),
              details: role.location ?? undefined,
              description: localized(role.descriptionEn, role.descriptionNl),
              skills: names(role.skills),
            }))
          : [];
        const publicProjects: CvEntry[] = enabled('PROJECTS')
          ? projects.map((project) => ({
              heading: project.title,
              pageUrl: new URL(
                `/${locale}/projects/${encodeURIComponent(project.slug)}`,
                process.env.PUBLIC_SITE_URL || 'https://ebeerens.com'
              ).href,
              organization: project.client ?? undefined,
              period: period(project.startDate, project.endDate),
              details: project.jobRole ?? undefined,
              description: localized(project.shortDescriptionEn, project.shortDescriptionNl),
              skills: names(project.skills),
              url: project.liveUrl ?? undefined,
            }))
          : [];
        const siteUrl = process.env.PUBLIC_SITE_URL || 'https://ebeerens.com';
        const links = [{ label: 'Portfolio', url: siteUrl }];
        if (enabled('CONTACT')) {
          links.push({ label: 'Contact', url: new URL('/contact', siteUrl).href });
        }
        if (profile.linkedinUrl) links.push({ label: 'LinkedIn', url: profile.linkedinUrl });
        if (profile.githubUrl) links.push({ label: 'GitHub', url: profile.githubUrl });
        const categories = new Map<string, { name: string; skills: Set<string> }>();
        const includedSkills = [
          ...(enabled('ROLES') ? roles.flatMap((role) => role.skills) : []),
          ...(enabled('PROJECTS') ? projects.flatMap((project) => project.skills) : []),
        ];
        for (const skill of includedSkills) {
          if (!skill.category) continue;
          let category = categories.get(skill.category.id);
          if (!category) {
            category = { name: skill.category.name, skills: new Set() };
            categories.set(skill.category.id, category);
          }
          category.skills.add(skill.name);
        }
        return {
          locale,
          name: profile.name,
          headline: profile.headline ?? undefined,
          bio: localized(profile.bioEn, profile.bioNl),
          location: profile.location ?? undefined,
          avatarUrl: githubAvatarUrl(profile.avatarUrl, profile.githubUrl),
          links,
          roles: publicRoles,
          projects: publicProjects,
          education: education.map((entry) => ({
            heading: entry.degree,
            organization: entry.institution.name,
            period: period(entry.startDate, entry.endDate),
            details: entry.fieldOfStudy ?? undefined,
            description: localized(entry.descriptionEn, entry.descriptionNl),
            skills: [],
          })),
          skills: [...categories.values()]
            .map((category) => ({ name: category.name, skills: [...category.skills].sort() }))
            .sort((first, second) => first.name.localeCompare(second.name, locale)),
        };
      },
      { isolationLevel: 'RepeatableRead' }
    );
  }
}

export function githubAvatarUrl(avatar?: string | null, github?: string | null): string | undefined {
  if (avatar) {
    try {
      const url = new URL(avatar);
      if (
        url.protocol === 'https:' &&
        url.hostname === 'avatars.githubusercontent.com' &&
        !url.port &&
        !url.username &&
        !url.password
      ) {
        url.searchParams.set('s', '256');
        return url.href;
      }
    } catch {
      return undefined;
    }
  }
  if (github) {
    try {
      const url = new URL(github);
      const username = url.pathname.split('/').filter(Boolean)[0];
      if (url.protocol === 'https:' && url.hostname === 'github.com' && username && /^[a-zA-Z0-9-]+$/.test(username)) {
        return `https://avatars.githubusercontent.com/${username}?s=256`;
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}
