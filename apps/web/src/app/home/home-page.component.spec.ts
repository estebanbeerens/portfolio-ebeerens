import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';
import {
  FeatureFlagDto,
  FeatureFlagsService,
  ProfileDto,
  ProfileService,
  ProjectDto,
  ProjectsService,
  RoleDto,
  RolesService,
} from '@portfolio-ebeerens/api-client';
import { of } from 'rxjs';
import { HomePage } from './home-page.component';

const profile: ProfileDto = {
  id: 'profile-1',
  name: 'Alex Mercer',
  headline: 'Full-Stack & Creative Tech',
  bio: 'Designing polished software.',
  location: 'Amsterdam, Netherlands',
  githubUrl: 'https://github.com/alex',
  linkedinUrl: 'https://linkedin.com/in/alex',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const roles: RoleDto[] = [
  {
    id: 'role-1',
    jobTitle: 'Senior Developer',
    organization: { id: 'org-1', name: 'Nebula Labs', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    startDate: '2023-01-01',
    skills: [{ id: 'skill-1', name: 'Angular' }],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

const projects: ProjectDto[] = [
  {
    id: 'project-1',
    title: 'Aether Dashboard',
    slug: 'aether-dashboard',
    shortDescription: 'A real-time analytics cockpit.',
    description: 'Long description',
    startDate: '2024-01-01',
    skills: [{ id: 'skill-2', name: 'TypeScript' }],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

describe('HomePage', () => {
  it('renders API-backed homepage sections when feature flags are enabled', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideMarkdown(),
        provideRouter([]),
        { provide: ProfileService, useValue: { profileControllerGetProfile: () => of(profile) } },
        { provide: RolesService, useValue: { rolesControllerFindAll: () => of(roles) } },
        { provide: ProjectsService, useValue: { projectsControllerFindAll: () => of(projects) } },
        {
          provide: FeatureFlagsService,
          useValue: {
            featureFlagsControllerFindAll: () =>
              of([
                { key: FeatureFlagDto.KeyEnum.Roles, enabled: true, updatedAt: '2026-01-01' },
                { key: FeatureFlagDto.KeyEnum.Projects, enabled: true, updatedAt: '2026-01-01' },
              ]),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Crafting fluid');
    expect(compiled.textContent).toContain('Nebula Labs');
    expect(compiled.textContent).toContain('Aether Dashboard');
  });
});
