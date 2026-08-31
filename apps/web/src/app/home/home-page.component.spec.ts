import { DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  FeatureFlagDto,
  ProfileService,
  PublicProfileDto,
  PublicProjectDto,
  PublicRoleDto,
} from '@portfolio-ebeerens/api-client';
import { of } from 'rxjs';
import { axe } from 'vitest-axe';
import { HomePage } from './home-page.component';

const profile: PublicProfileDto = {
  id: 'profile-1',
  name: 'Alex Mercer',
  headline: 'Full-Stack & Creative Tech',
  bio: 'Designing polished software.',
  location: 'Amsterdam, Netherlands',
  githubUrl: 'https://github.com/alex',
  linkedinUrl: 'https://linkedin.com/in/alex',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const roles: PublicRoleDto[] = [
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

const projects: PublicProjectDto[] = [
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
      deferBlockBehavior: DeferBlockBehavior.Manual,
      providers: [
        provideRouter([]),
        {
          provide: ProfileService,
          useValue: {
            profileControllerGetPublicPortfolio: () =>
              of({
                profile,
                roles,
                projects,
                featureFlags: [
                  { key: FeatureFlagDto.KeyEnum.Roles, enabled: true, updatedAt: '2026-01-01' },
                  { key: FeatureFlagDto.KeyEnum.Projects, enabled: true, updatedAt: '2026-01-01' },
                ],
              }),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    const deferBlocks = await fixture.getDeferBlocks();
    await Promise.all(deferBlocks.map((deferBlock) => deferBlock.render(DeferBlockState.Complete)));
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Crafting fluid');
    expect(compiled.textContent).toContain('Nebula Labs');
    expect(compiled.textContent).toContain('Aether Dashboard');
  });

  it('has no accessibility violations', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        {
          provide: ProfileService,
          useValue: {
            profileControllerGetPublicPortfolio: () =>
              of({
                profile,
                roles,
                projects,
                featureFlags: [
                  { key: FeatureFlagDto.KeyEnum.Roles, enabled: true, updatedAt: '2026-01-01' },
                  { key: FeatureFlagDto.KeyEnum.Projects, enabled: true, updatedAt: '2026-01-01' },
                ],
              }),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    fixture.detectChanges();

    const results = await axe(fixture.nativeElement);
    (expect(results) as unknown as { toHaveNoViolations: () => void }).toHaveNoViolations();
  });
});
