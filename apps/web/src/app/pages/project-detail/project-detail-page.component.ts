import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectDto, ProjectsService } from '@portfolio-ebeerens/api-client';
import { Button } from '@portfolio-ebeerens/ui';
import { LucideArrowLeft, LucideDynamicIcon, LucideExternalLink } from '@lucide/angular';
import { MarkdownComponent } from 'ngx-markdown';
import { map } from 'rxjs';
import { ProjectCard } from '../../shared/project-card/project-card.component';
import { projectDuration, projectYear } from '../../shared/project-summary.util';
import { PortfolioContentService } from '../../shared/portfolio-content.service';

const RELATED_PROJECTS_LIMIT = 3;

@Component({
  selector: 'web-project-detail-page',
  imports: [MarkdownComponent, RouterLink, Button, LucideDynamicIcon, ProjectCard],
  templateUrl: './project-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailPage {
  protected readonly content = inject(PortfolioContentService);
  private readonly projectsApi = inject(ProjectsService);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly slug = toSignal(this.route.paramMap.pipe(map((params) => params.get('slug') ?? '')), {
    initialValue: '',
  });

  protected readonly project = computed(() => this.content.projectBySlug(this.slug()));
  protected readonly backIcon = LucideArrowLeft;
  protected readonly externalLinkIcon = LucideExternalLink;

  protected readonly projectYear = projectYear;
  protected readonly projectDuration = projectDuration;

  private readonly relatedProjects = rxResource({
    params: () => this.project()?.id,
    stream: ({ params: id }) => this.projectsApi.projectsControllerFindRelated(id, RELATED_PROJECTS_LIMIT),
  });

  protected readonly relatedProjectsList = computed<ProjectDto[]>(() =>
    this.relatedProjects.hasValue() ? this.relatedProjects.value() : []
  );

  constructor() {
    effect(() => {
      const project = this.project();
      if (project) {
        this.title.setTitle(project.title);
        this.meta.updateTag({ name: 'description', content: project.shortDescription });
      } else if (this.content.projectsLoaded()) {
        this.title.setTitle('Project not found');
      }
    });
  }
}
