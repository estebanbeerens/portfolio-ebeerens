import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProjectDto } from '@portfolio-ebeerens/api-client';
import { ProjectList } from './project-list.component';

const project: ProjectDto = {
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
