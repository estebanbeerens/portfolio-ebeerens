import { Injectable, NotFoundException } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Locale, resolveLocale } from '../shared/locale.util';
import { ProfileService } from '../profile/profile.service';
import { ProjectsService } from '../projects/projects.service';
import { SkillsService } from '../skills/skills.service';

const DESCRIPTION_LIMIT = 12_000;
const MAX_RESULTS = 20;

@Injectable()
export class McpToolsService {
  constructor(
    private readonly profile: ProfileService,
    private readonly projects: ProjectsService,
    private readonly skills: SkillsService
  ) {}

  register(server: McpServer): void {
    server.registerTool(
      'get_profile',
      {
        description: 'Get the public portfolio owner profile, including biography and public links.',
        inputSchema: { locale: localeSchema },
      },
      async ({ locale }) => this.result(await this.getProfile(locale))
    );

    server.registerTool(
      'search_projects',
      {
        description: 'Search published portfolio projects by title, description, client, role, or skill.',
        inputSchema: {
          query: z.string().trim().min(1).max(100),
          locale: localeSchema,
          limit: limitSchema,
        },
      },
      async ({ query, locale, limit }) => this.result(await this.searchProjects(query, locale, limit))
    );

    server.registerTool(
      'get_project',
      {
        description: 'Get a public project by its ID or slug.',
        inputSchema: { idOrSlug: z.string().trim().min(1).max(100), locale: localeSchema },
      },
      async ({ idOrSlug, locale }) => this.result(await this.getProject(idOrSlug, locale))
    );

    server.registerTool(
      'list_experience',
      {
        description: 'List public work experience, including organizations and skills.',
        inputSchema: { locale: localeSchema, limit: limitSchema },
      },
      async ({ locale, limit }) => this.result(await this.listExperience(locale, limit))
    );

    server.registerTool(
      'get_experience',
      {
        description: 'Get a public work-experience entry by its ID.',
        inputSchema: { id: z.string().trim().min(1).max(100), locale: localeSchema },
      },
      async ({ id, locale }) => this.result(await this.getExperience(id, locale))
    );

    server.registerTool(
      'list_skills',
      {
        description: 'List public skills associated with portfolio projects and experience.',
        inputSchema: { limit: limitSchema },
      },
      async ({ limit }) => this.result((await this.skills.findAll()).slice(0, limit ?? MAX_RESULTS))
    );

    server.registerTool(
      'list_education',
      {
        description: 'List public education entries, including institution and study details.',
        inputSchema: { locale: localeSchema, limit: limitSchema },
      },
      async ({ locale, limit }) => this.result(await this.listEducation(locale, limit))
    );

    server.registerTool(
      'search_portfolio',
      {
        description: 'Search public projects, work experience, education, and profile text.',
        inputSchema: {
          query: z.string().trim().min(1).max(100),
          locale: localeSchema,
          limit: limitSchema,
        },
      },
      async ({ query, locale, limit }) => this.result(await this.searchPortfolio(query, locale, limit))
    );
  }

  async getProfile(locale?: string) {
    const { profile } = await this.profile.findPublicPortfolio(this.locale(locale));
    if (!profile) {
      throw new NotFoundException('Public profile not found');
    }
    return pick(profile, [
      'id',
      'name',
      'headline',
      'bio',
      'avatarUrl',
      'location',
      'linkedinUrl',
      'githubUrl',
      'instagramUrl',
      'xUrl',
      'youtubeUrl',
    ]);
  }

  async searchProjects(query: string, locale?: string, limit?: number) {
    const normalized = query.toLocaleLowerCase();
    const projects = await this.projects.findPublicAll(this.locale(locale));
    return projects
      .filter((project) =>
        [
          project.title,
          project.shortDescription,
          project.description,
          project.client,
          project.jobRole,
          ...project.skills.map((skill) => skill.name),
        ]
          .filter(isText)
          .some((value) => value.toLocaleLowerCase().includes(normalized))
      )
      .slice(0, this.limit(limit))
      .map(publicProject);
  }

  async getProject(idOrSlug: string, locale?: string) {
    const projects = await this.projects.findPublicAll(this.locale(locale));
    const project = projects.find((item) => item.id === idOrSlug || item.slug === idOrSlug);
    if (!project) {
      throw new NotFoundException('Public project not found');
    }
    return publicProject(project);
  }

  async listExperience(locale?: string, limit?: number) {
    const { roles } = await this.profile.findPublicPortfolio(this.locale(locale));
    return roles.slice(0, this.limit(limit)).map(publicRole);
  }

  async getExperience(id: string, locale?: string) {
    const { roles } = await this.profile.findPublicPortfolio(this.locale(locale));
    const role = roles.find((item) => item.id === id);
    if (!role) {
      throw new NotFoundException('Public experience entry not found');
    }
    return publicRole(role);
  }

  async listEducation(locale?: string, limit?: number) {
    const { education } = await this.profile.findPublicPortfolio(this.locale(locale));
    return education.slice(0, this.limit(limit)).map(publicEducation);
  }

  async searchPortfolio(query: string, locale?: string, limit?: number) {
    const resolvedLocale = this.locale(locale);
    const [portfolio, projects] = await Promise.all([
      this.profile.findPublicPortfolio(resolvedLocale),
      this.projects.findPublicAll(resolvedLocale),
    ]);
    const normalized = query.toLocaleLowerCase();
    const matches: Array<{ type: string; id: string; title: string; summary: string }> = [];
    const addMatch = (entry: { type: string; id: string; title: string; searchable: string[]; summary: string }) => {
      if (
        matches.length < this.limit(limit) &&
        entry.searchable.some((value) => value.toLocaleLowerCase().includes(normalized))
      ) {
        matches.push({ type: entry.type, id: entry.id, title: entry.title, summary: entry.summary });
      }
    };

    if (portfolio.profile) {
      addMatch({
        type: 'profile',
        id: portfolio.profile.id,
        title: portfolio.profile.name,
        searchable: [portfolio.profile.name, portfolio.profile.headline, portfolio.profile.bio].filter(isText),
        summary: truncate(portfolio.profile.headline ?? portfolio.profile.bio ?? ''),
      });
    }
    for (const project of projects) {
      addMatch({
        type: 'project',
        id: project.id,
        title: project.title,
        searchable: [
          project.title,
          project.shortDescription,
          project.description,
          project.client,
          project.jobRole,
          ...project.skills.map((skill) => skill.name),
        ].filter(isText),
        summary: truncate(project.shortDescription),
      });
    }
    for (const role of portfolio.roles) {
      addMatch({
        type: 'experience',
        id: role.id,
        title: role.jobTitle,
        searchable: [
          role.jobTitle,
          role.organization.name,
          role.description,
          role.location,
          ...role.skills.map((skill) => skill.name),
        ].filter(isText),
        summary: truncate(role.description ?? role.organization.name),
      });
    }
    for (const entry of portfolio.education) {
      addMatch({
        type: 'education',
        id: entry.id,
        title: entry.degree,
        searchable: [entry.degree, entry.fieldOfStudy, entry.institution.name, entry.description].filter(isText),
        summary: truncate(entry.fieldOfStudy ?? entry.institution.name),
      });
    }
    return matches;
  }

  private locale(locale?: string): Locale {
    return resolveLocale(locale);
  }

  private limit(limit?: number): number {
    return Math.min(Math.max(limit ?? 10, 1), MAX_RESULTS);
  }

  private result(value: unknown) {
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(value) }],
    };
  }
}

const localeSchema = z.enum(['en', 'nl']).optional();
const limitSchema = z.number().int().min(1).max(MAX_RESULTS).optional();

function publicProject(project: Awaited<ReturnType<ProjectsService['findPublicAll']>>[number]) {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    shortDescription: truncate(project.shortDescription),
    description: truncate(project.description),
    imageUrl: project.imageUrl ?? undefined,
    client: project.client ?? undefined,
    jobRole: project.jobRole ?? undefined,
    liveUrl: project.liveUrl ?? undefined,
    startDate: project.startDate,
    endDate: project.endDate ?? undefined,
    skills: project.skills.map(({ id, name }) => ({ id, name })),
  };
}

function publicRole(role: Awaited<ReturnType<ProfileService['findPublicPortfolio']>>['roles'][number]) {
  return {
    id: role.id,
    jobTitle: role.jobTitle,
    organization: {
      id: role.organization.id,
      name: role.organization.name,
      logoUrl: role.organization.logoUrl ?? undefined,
      website: role.organization.website ?? undefined,
    },
    description: truncate(role.description ?? ''),
    location: role.location ?? undefined,
    employmentType: role.employmentType ?? undefined,
    startDate: role.startDate,
    endDate: role.endDate ?? undefined,
    skills: role.skills.map(({ id, name }) => ({ id, name })),
  };
}

function publicEducation(entry: Awaited<ReturnType<ProfileService['findPublicPortfolio']>>['education'][number]) {
  return {
    id: entry.id,
    degree: entry.degree,
    fieldOfStudy: entry.fieldOfStudy ?? undefined,
    institution: {
      id: entry.institution.id,
      name: entry.institution.name,
      logoUrl: entry.institution.logoUrl ?? undefined,
      website: entry.institution.website ?? undefined,
    },
    description: truncate(entry.description ?? ''),
    startDate: entry.startDate,
    endDate: entry.endDate ?? undefined,
  };
}

function pick<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K> {
  return Object.fromEntries(keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]])) as Pick<
    T,
    K
  >;
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function truncate(value: string): string {
  return value.length > DESCRIPTION_LIMIT ? `${value.slice(0, DESCRIPTION_LIMIT)}…` : value;
}
