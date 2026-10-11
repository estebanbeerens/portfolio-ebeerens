import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProjectDto } from '@portfolio-ebeerens/api-client';
import { ProjectList } from './project-list.component';

const project: ProjectDto = {
  isCvFeatured: false,
  id: 'project-1',
  title: 'Portfolio site',
  slug: 'portfolio-site',
  shortDescriptionEn: 'A concise portfolio project summary.',
  descriptionEn: '## Overview',
  startDate: '2024-01-15',
  skills: [{ id: 'skill-1', name: 'Angular' }],
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

@Component({
  imports: [ProjectList],
  template: `
    <admin-project-list
      [projects]="projects"
      [loading]="loading"
      [error]="error"
      (create)="createCount = createCount + 1"
      (edit)="edited = $event"
      (delete)="deleted = $event"
      (retry)="retryCount = retryCount + 1"
      (toggleCv)="starred = $event"
    />
  `,
})
class HostComponent {
  projects: ProjectDto[] | undefined = [project];
  loading = false;
  error: string | undefined;
  createCount = 0;
  retryCount = 0;
  edited: ProjectDto | undefined;
  deleted: ProjectDto | undefined;
  starred: ProjectDto | undefined;
}

describe('ProjectList', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('renders projects and their skills', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Portfolio site');
    expect(text).toContain('/portfolio-site');
    expect(text).toContain('Angular');
  });

  it('exposes the star as a named toggle and emits the selected project', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const star = fixture.nativeElement.querySelector('button[aria-pressed]') as HTMLButtonElement;
    expect(star.getAttribute('aria-pressed')).toBe('false');
    expect(star.getAttribute('aria-label')).toContain('Portfolio site');
    star.click();
    expect(fixture.componentInstance.starred).toEqual(project);
  });

  it('fills highlighted stars and leaves other stars outlined', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.projects = [project, { ...project, id: 'featured', isCvFeatured: true }];
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('button[aria-pressed]') as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[0].querySelector('svg')?.classList.contains('[&_path]:fill-none')).toBe(true);
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].querySelector('svg')?.classList.contains('[&_path]:fill-current')).toBe(true);
    expect(buttons[1].querySelector('path')).not.toBeNull();
  });

  it('renders a loading state', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.loading = true;
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading projects...');
  });

  it('renders an error state and emits retry', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.error = 'Projects could not be loaded. Try again.';
    await fixture.whenStable();

    const retryButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'Try again'
    ) as HTMLButtonElement;
    retryButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.retryCount).toBe(1);
  });

  it('renders an empty state and emits create', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.projects = [];
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No projects yet.');

    const createButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'Create your first project'
    ) as HTMLButtonElement;
    createButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.createCount).toBe(1);
  });

  it('emits edit and delete for a project row', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    (buttons.find((button) => button.textContent?.trim() === 'Edit') as HTMLButtonElement).click();
    (buttons.find((button) => button.textContent?.trim() === 'Delete') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.edited).toEqual(project);
    expect(fixture.componentInstance.deleted).toEqual(project);
  });
});
