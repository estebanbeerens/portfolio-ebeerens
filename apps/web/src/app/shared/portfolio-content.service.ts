import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  FeatureFlagDto,
  OrganizationDto,
  ProfileService,
  PublicProfileDto,
  PublicProjectDto,
  PublicRoleDto,
} from '@portfolio-ebeerens/api-client';

export interface RoleCompanyGroup {
  organization: OrganizationDto;
  roles: PublicRoleDto[];
  startDate: string;
  endDate?: string;
}

@Injectable({ providedIn: 'root' })
export class PortfolioContentService {
  private readonly publicPortfolioApi = inject(ProfileService);

  readonly portfolio = rxResource({ stream: () => this.publicPortfolioApi.profileControllerGetPublicPortfolio() });

  readonly profileValue = computed<PublicProfileDto | undefined>(() =>
    this.portfolio.hasValue() ? this.portfolio.value().profile : undefined
  );

  readonly sortedRoles = computed<PublicRoleDto[]>(() => {
    if (!this.portfolio.hasValue()) {
      return [];
    }
    return [...this.portfolio.value().roles].sort((a, b) => dateValue(b.startDate) - dateValue(a.startDate));
  });

  readonly roleCompanyGroups = computed<RoleCompanyGroup[]>(() => groupRolesByCompany(this.sortedRoles()));

  readonly sortedProjects = computed<PublicProjectDto[]>(() => {
    if (!this.portfolio.hasValue()) {
      return [];
    }
    return [...this.portfolio.value().projects].sort(
      (a, b) => dateValue(b.endDate ?? b.startDate) - dateValue(a.endDate ?? a.startDate)
    );
  });

  readonly selectedProjects = computed<PublicProjectDto[]>(() => this.sortedProjects().slice(0, 6));

  readonly projectsLoaded = computed(() => this.portfolio.hasValue());
  readonly rolesEnabled = computed(() => this.flagEnabled(FeatureFlagDto.KeyEnum.Roles));
  readonly projectsEnabled = computed(() => this.flagEnabled(FeatureFlagDto.KeyEnum.Projects));
  readonly contactEnabled = computed(() => this.flagEnabled(FeatureFlagDto.KeyEnum.Contact));
  readonly resumeEnabled = computed(() => this.flagEnabled(FeatureFlagDto.KeyEnum.Resume));

  readonly loadError = computed(() =>
    this.portfolio.error() ? 'Portfolio content could not be loaded. Try refreshing the page.' : undefined
  );

  projectBySlug(slug: string): PublicProjectDto | undefined {
    return this.sortedProjects().find((project) => project.slug === slug);
  }

  private flagEnabled(key: FeatureFlagDto.KeyEnum): boolean {
    if (!this.portfolio.hasValue()) {
      return false;
    }
    return this.portfolio.value().featureFlags.find((flag) => flag.key === key)?.enabled ?? false;
  }
}

function groupRolesByCompany(roles: PublicRoleDto[]): RoleCompanyGroup[] {
  const groups = new Map<string, RoleCompanyGroup>();

  for (const role of roles) {
    const existing = groups.get(role.organization.id);
    if (existing) {
      existing.roles.push(role);
      existing.startDate = earlierDate(existing.startDate, role.startDate);
      existing.endDate = latestOptionalDate(existing.endDate, role.endDate);
    } else {
      groups.set(role.organization.id, {
        organization: role.organization,
        roles: [role],
        startDate: role.startDate,
        ...(role.endDate ? { endDate: role.endDate } : {}),
      });
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      roles: [...group.roles].sort((a, b) => dateValue(b.startDate) - dateValue(a.startDate)),
    }))
    .sort((a, b) => dateValue(b.roles[0].startDate) - dateValue(a.roles[0].startDate));
}

function earlierDate(current: string, candidate: string): string {
  return dateValue(candidate) < dateValue(current) ? candidate : current;
}

function latestOptionalDate(current: string | undefined, candidate: string | undefined): string | undefined {
  if (!current || !candidate) {
    return undefined;
  }
  return dateValue(candidate) > dateValue(current) ? candidate : current;
}

function dateValue(value: string): number {
  return new Date(value).getTime();
}
