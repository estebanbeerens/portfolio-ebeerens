import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ProjectDto, ProjectsService } from '@portfolio-ebeerens/api-client';
import { provideMarkdown } from 'ngx-markdown';
import { Observable, of } from 'rxjs';
import { PortfolioContentService } from '../../shared/portfolio-content.service';
import { ProjectDetailPage } from './project-detail-page.component';

const project: ProjectDto = {
  id: 'project-1',
  title: 'Aether Dashboard',
  slug: 'aether-dashboard',
  shortDescription: 'A real-time analytics cockpit.',
  description: '**Long** description',
  startDate: '2024-01-01',
  liveUrl: 'https://example.com',
  skills: [{ id: 'skill-1', name: 'TypeScript' }],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const relatedProject: ProjectDto = {
  id: 'project-2',
  title: 'Vertex Portfolio CMS',
  slug: 'vertex-portfolio-cms',
  shortDescription: 'A headlessly integrated portfolio compiler.',
  description: 'Long description',
  startDate: '2022-01-01',
  skills: [{ id: 'skill-1', name: 'TypeScript' }],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('ProjectDetailPage', () => {
  function configure(options: {
    slug: string;
    projectBySlug: () => ProjectDto | undefined;
    findRelated?: () => Observable<ProjectDto[]>;
  }) {
    return TestBed.configureTestingModule({
      imports: [ProjectDetailPage],
      providers: [
        provideMarkdown(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ slug: options.slug })) } },
        {
          provide: PortfolioContentService,
          useValue: { projectBySlug: options.projectBySlug, projectsLoaded: signal(true) },
        },
        {
          provide: ProjectsService,
          useValue: { projectsControllerFindRelated: options.findRelated ?? (() => of([])) },
        },
      ],
    }).compileComponents();
  }

  it('resolves a project by route slug and renders a back-to-directory button', async () => {
    await configure({ slug: 'aether-dashboard', projectBySlug: () => project });

    const fixture = TestBed.createComponent(ProjectDetailPage);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';
    expect(text).toContain('Aether Dashboard');
    expect(text).toContain('TypeScript');
    const backLink = compiled.querySelector('a[href="/projects"]');
    expect(backLink?.textContent).toContain('Go back to project directory');
  });

  it('renders an external-link icon with the live project action', async () => {
    await configure({ slug: 'aether-dashboard', projectBySlug: () => project });

    const fixture = TestBed.createComponent(ProjectDetailPage);
    await fixture.whenStable();

    const liveProjectLink = (fixture.nativeElement as HTMLElement).querySelector('a[href="https://example.com"]');
    expect(liveProjectLink?.querySelector('svg.lucide-external-link')).not.toBeNull();
  });

  it('renders not found when loaded projects do not contain the slug', async () => {
    await configure({ slug: 'missing', projectBySlug: () => undefined });

    const fixture = TestBed.createComponent(ProjectDetailPage);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Project not found');
  });

  it('renders related projects returned by the API, excluding the current project', async () => {
    await configure({
      slug: 'aether-dashboard',
      projectBySlug: () => project,
      findRelated: () => of([relatedProject]),
    });

    const fixture = TestBed.createComponent(ProjectDetailPage);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('More Projects');
    expect(text).toContain('Vertex Portfolio CMS');
  });

  it('hides the more-projects section when no related projects are returned', async () => {
    await configure({ slug: 'aether-dashboard', projectBySlug: () => project, findRelated: () => of([]) });

    const fixture = TestBed.createComponent(ProjectDetailPage);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('More Projects');
  });
});
