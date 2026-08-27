import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FeatureFlagDto, ProfileService } from '@portfolio-ebeerens/api-client';
import { axe } from 'vitest-axe';
import { of } from 'rxjs';
import { Header } from './header.component';

const allFlagsEnabled = [
  { key: FeatureFlagDto.KeyEnum.Roles, enabled: true, updatedAt: '2026-01-01' },
  { key: FeatureFlagDto.KeyEnum.Projects, enabled: true, updatedAt: '2026-01-01' },
  { key: FeatureFlagDto.KeyEnum.Contact, enabled: true, updatedAt: '2026-01-01' },
  { key: FeatureFlagDto.KeyEnum.Resume, enabled: true, updatedAt: '2026-01-01' },
];

function configure(flags: Partial<FeatureFlagDto>[] = allFlagsEnabled) {
  return TestBed.configureTestingModule({
    imports: [Header],
    providers: [
      provideRouter([]),
      {
        provide: ProfileService,
        useValue: {
          profileControllerGetPublicPortfolio: () =>
            of({ profile: undefined, roles: [], projects: [], featureFlags: flags }),
        },
      },
    ],
  }).compileComponents();
}

describe('Header', () => {
  it('renders the profile name from basic info and route links when flags are enabled', async () => {
    await configure();

    const fixture = TestBed.createComponent(Header);
    fixture.componentRef.setInput('profile', { id: 'profile-1', name: 'John Beerens', updatedAt: '2026-01-01' });
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('John Beerens');
    expect(compiled.querySelector('a[href="/resume"]')?.textContent).toContain('Resume');
    expect(compiled.querySelector('a[href="/projects"]')?.textContent).toContain('Projects');
    expect(compiled.querySelector('a[href="/contact"]')?.textContent).toContain('Contact');
  });

  it('hides gated nav links when their feature flag is disabled', async () => {
    await configure([
      { key: FeatureFlagDto.KeyEnum.Roles, enabled: false, updatedAt: '2026-01-01' },
      { key: FeatureFlagDto.KeyEnum.Resume, enabled: false, updatedAt: '2026-01-01' },
    ]);

    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a[href="/resume"]')).toBeNull();
    expect(compiled.querySelector('a[href="/projects"]')).toBeNull();
    expect(compiled.querySelector('a[href="/contact"]')).toBeNull();
  });

  it('does not fall back to a hard-coded profile name', async () => {
    await configure();

    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Alex Mercer');
  });

  it('has no accessibility violations', async () => {
    await configure();

    const fixture = TestBed.createComponent(Header);
    fixture.componentRef.setInput('profile', { id: 'profile-1', name: 'John Beerens', updatedAt: '2026-01-01' });
    await fixture.whenStable();

    const results = await axe(fixture.nativeElement);
    // vitest-axe's ambient `Assertion` augmentation doesn't merge cleanly under this vitest version's types.
    (expect(results) as unknown as { toHaveNoViolations: () => void }).toHaveNoViolations();
  });
});
