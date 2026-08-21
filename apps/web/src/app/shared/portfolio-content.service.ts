import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  FeatureFlagDto,
  FeatureFlagsService,
  OrganizationDto,
  ProfileDto,
  ProfileService,
  ProjectDto,
  ProjectsService,
  RoleDto,
  RolesService,
} from '@portfolio-ebeerens/api-client';
import { catchError, of } from 'rxjs';

export interface RoleCompanyGroup {
  organization: OrganizationDto;
  roles: RoleDto[];
  startDate: string;
  endDate?: string;
}

@Injectable({ providedIn: 'root' })
export class PortfolioContentService {
  private readonly profileApi = inject(ProfileService);
  private readonly rolesApi = inject(RolesService);
  private readonly projectsApi = inject(ProjectsService);
  private readonly featureFlagsApi = inject(FeatureFlagsService);

  readonly profile = rxResource({
    stream: () =>
      this.profileApi.profileControllerGetProfile().pipe(
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            return of(undefined);
          }
          throw error;
        })
      ),
  });

  readonly roles = rxResource({ stream: () => this.rolesApi.rolesControllerFindAll() });
  readonly projects = rxResource({ stream: () => this.projectsApi.projectsControllerFindAll() });
  readonly featureFlags = rxResource({ stream: () => this.featureFlagsApi.featureFlagsControllerFindAll() });

  readonly profileValue = computed<ProfileDto | undefined>(() =>
    this.profile.hasValue() ? this.profile.value() : undefined
  );

  readonly sortedRoles = computed<RoleDto[]>(() => {
    if (!this.roles.hasValue()) {
      return [];
    }
    return [...this.roles.value()].sort((a, b) => dateValue(b.startDate) - dateValue(a.startDate));
  });

  readonly roleCompanyGroups = computed<RoleCompanyGroup[]>(() => groupRolesByCompany(this.sortedRoles()));

  readonly sortedProjects = computed<ProjectDto[]>(() => {
    if (!this.projects.hasValue()) {
      return [];
    }
    return [...this.projects.value()].sort(
      (a, b) => dateValue(b.endDate ?? b.startDate) - dateValue(a.endDate ?? a.startDate)
    );
  });

  readonly selectedProjects = computed<ProjectDto[]>(() => this.sortedProjects().slice(0, 6));

  readonly projectsLoaded = computed(() => this.projects.hasValue());
  readonly rolesEnabled = computed(() => this.flagEnabled(FeatureFlagDto.KeyEnum.Roles));
  readonly projectsEnabled = computed(() => this.flagEnabled(FeatureFlagDto.KeyEnum.Projects));
  readonly contactEnabled = computed(() => this.flagEnabled(FeatureFlagDto.KeyEnum.Contact));
  readonly skillsEnabled = computed(() => this.flagEnabled(FeatureFlagDto.KeyEnum.Skills));

  readonly loadError = computed(() =>
    this.profile.error() || this.roles.error() || this.projects.error() || this.featureFlags.error()
      ? 'Portfolio content could not be loaded. Try refreshing the page.'
      : undefined
  );

  projectBySlug(slug: string): ProjectDto | undefined {
    return this.sortedProjects().find((project) => project.slug === slug);
  }

  private flagEnabled(key: FeatureFlagDto.KeyEnum): boolean {
    if (!this.featureFlags.hasValue()) {
      return false;
    }
    return this.featureFlags.value().find((flag) => flag.key === key)?.enabled ?? false;
  }
}

function groupRolesByCompany(roles: RoleDto[]): RoleCompanyGroup[] {
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
