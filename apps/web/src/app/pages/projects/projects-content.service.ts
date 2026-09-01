import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProjectsService, PublicProjectDto } from '@portfolio-ebeerens/api-client';

@Injectable({ providedIn: 'root' })
export class ProjectsContentService {
  private readonly projectsApi = inject(ProjectsService);

  private readonly projects = rxResource({ stream: () => this.projectsApi.projectsControllerFindPublicAll() });

  readonly sortedProjects = computed<PublicProjectDto[]>(() => {
    if (!this.projects.hasValue()) {
      return [];
    }
    return [...this.projects.value()].sort(
      (a, b) => dateValue(b.endDate ?? b.startDate) - dateValue(a.endDate ?? a.startDate)
    );
  });

  readonly projectsLoaded = computed(() => this.projects.hasValue());

  projectBySlug(slug: string): PublicProjectDto | undefined {
    return this.sortedProjects().find((project) => project.slug === slug);
  }
}

function dateValue(value: string): number {
  return new Date(value).getTime();
}
