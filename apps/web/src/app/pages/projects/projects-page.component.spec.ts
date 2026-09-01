import { signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PublicProjectDto } from '@portfolio-ebeerens/api-client';
import { ProjectsContentService } from './projects-content.service';
import { ProjectsPage } from './projects-page.component';

const project: PublicProjectDto = {
  id: 'project-1',
  title: 'Aether Dashboard',
  slug: 'aether-dashboard',
  startDate: '2024-03-01',
  endDate: '2024-12-01',
  skills: [{ id: 'skill-1', name: 'Angular' }],
  shortDescription: 'A project summary.',
  description: 'A project description.',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('ProjectsPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsPage],
      providers: [
        provideRouter([]),
        { provide: Meta, useValue: { updateTag: vi.fn() } },
        { provide: ProjectsContentService, useValue: { sortedProjects: signal([project]) } },
      ],
    }).compileComponents();
  });

  it('renders the project list by default', async () => {
    const fixture = TestBed.createComponent(ProjectsPage);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="tabpanel"]')?.getAttribute('aria-label')).toBe('Project list');
    expect(compiled.querySelector('[role="tablist"]')?.getAttribute('aria-label')).toBe('Project display mode');
    expect(compiled.querySelector('a')?.getAttribute('href')).toBe('/projects/aether-dashboard');
  });

  it('renders full large-screen dates and compact years below large screens in the project list', async () => {
    const fixture = TestBed.createComponent(ProjectsPage);
    await fixture.whenStable();

    const date = fixture.nativeElement.querySelector('a time') as HTMLElement;
    expect(date.querySelector('.hidden')?.textContent?.trim()).toBe('mar 2024 - dec 2024');
    expect(date.querySelector('.lg\\:hidden')?.textContent?.trim()).toBe('2024');
  });

  it('switches to the timeline view', async () => {
    const fixture = TestBed.createComponent(ProjectsPage);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const timelineButton = compiled.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1];
    timelineButton.click();
    await fixture.whenStable();

    expect(compiled.querySelector('[role="tabpanel"]')?.getAttribute('aria-label')).toBe('Project timeline');
  });
});
