import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProjectDto, ProjectsService, SkillsService } from '@portfolio-ebeerens/api-client';
import { provideMarkdown } from 'ngx-markdown';
import { Projects } from './projects.component';

const project: ProjectDto = {
  id: 'project-1',
  title: 'Portfolio site',
  slug: 'portfolio-site',
  shortDescriptionEn: 'A concise portfolio project summary.',
  descriptionEn: '## Overview\n\nA concise portfolio project summary.',
  startDate: '2024-01-15',
  skills: [{ id: 'skill-1', name: 'Angular' }],
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

describe('Projects', () => {
  function configure(api: Partial<ProjectsService>) {
    TestBed.configureTestingModule({
      imports: [Projects],
      providers: [
        provideMarkdown(),
        provideRouter([]),
        { provide: ProjectsService, useValue: api },
        { provide: SkillsService, useValue: { skillsControllerFindAll: () => of([]) } },
      ],
    });
  }

  it('renders projects and their skills', async () => {
    configure({ projectsControllerFindAll: vi.fn(() => of([project])) as never });

    const fixture = TestBed.createComponent(Projects);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Portfolio site');
    expect(text).toContain('/portfolio-site');
    expect(text).toContain('Angular');
  });

  it('sorts projects from newest to oldest', async () => {
    const olderProject = {
      ...project,
      id: 'project-older',
      title: 'Older project',
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    const newerProject = {
      ...project,
      id: 'project-newer',
      title: 'Newer project',
      createdAt: '2025-01-01T00:00:00.000Z',
    };
    configure({ projectsControllerFindAll: vi.fn(() => of([olderProject, newerProject])) as never });

    const fixture = TestBed.createComponent(Projects);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const titles = Array.from(compiled.querySelectorAll<HTMLHeadingElement>('admin-project-list article h2')).map(
      (title) => title.textContent?.trim()
    );
    expect(titles).toEqual(['Newer project', 'Older project']);
  });

  it('renders an empty state when no projects exist', async () => {
    configure({ projectsControllerFindAll: vi.fn(() => of([])) as never });

    const fixture = TestBed.createComponent(Projects);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No projects yet.');
  });

  it('does not submit an invalid project form', async () => {
    const create = vi.fn();
    configure({ projectsControllerFindAll: vi.fn(() => of([])) as never, projectsControllerCreate: create as never });

    const fixture = TestBed.createComponent(Projects);
    await fixture.whenStable();
    const newProjectButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'New project'
    ) as HTMLButtonElement;
    newProjectButton.click();
    fixture.detectChanges();
    const saveButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'Save project'
    ) as HTMLButtonElement;
    saveButton.click();
    fixture.detectChanges();

    expect(create).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Enter a title.');
  });

  it('does not call delete when confirmation is cancelled', async () => {
    const remove = vi.fn();
    configure({
      projectsControllerFindAll: vi.fn(() => of([project])) as never,
      projectsControllerRemove: remove as never,
    });

    const fixture = TestBed.createComponent(Projects);
    await fixture.whenStable();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const deleteButton = buttons.find((button) => button.textContent?.trim() === 'Delete') as HTMLButtonElement;
    deleteButton.click();
    fixture.detectChanges();
    const dialogButtons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    (dialogButtons.find((button) => button.textContent?.trim() === 'Cancel') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(remove).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('This action cannot be undone.');
  });

  it('explains a failed project request', async () => {
    configure({
      projectsControllerFindAll: vi.fn(() => throwError(() => new Error('offline'))) as never,
    });

    const fixture = TestBed.createComponent(Projects);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Projects could not be loaded. Try again.');
  });
});
