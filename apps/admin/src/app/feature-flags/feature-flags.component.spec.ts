import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { FeatureFlagDto, FeatureFlagsService } from '@portfolio-ebeerens/api-client';
import { FeatureFlags } from './feature-flags.component';

const contactFlag: FeatureFlagDto = {
  key: FeatureFlagDto.KeyEnum.Contact,
  enabled: true,
  updatedAt: '2026-08-17T12:00:00.000Z',
};
const projectsFlag: FeatureFlagDto = {
  key: FeatureFlagDto.KeyEnum.Projects,
  enabled: false,
  updatedAt: '2026-08-17T12:00:00.000Z',
};

describe('FeatureFlags', () => {
  function configure(api: Partial<FeatureFlagsService>) {
    TestBed.configureTestingModule({
      imports: [FeatureFlags],
      providers: [{ provide: FeatureFlagsService, useValue: api }],
    });
  }

  it('renders each flag with its label and enabled state', async () => {
    configure({ featureFlagsControllerFindAll: vi.fn(() => of([contactFlag, projectsFlag])) as never });

    const fixture = TestBed.createComponent(FeatureFlags);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Contact');
    expect(text).toContain('Projects');

    const switches = fixture.nativeElement.querySelectorAll('button[role="switch"]');
    expect(switches[0].getAttribute('aria-checked')).toBe('true');
    expect(switches[1].getAttribute('aria-checked')).toBe('false');
  });

  it('updates a flag when its toggle is clicked', async () => {
    const update = vi.fn(() => of({ ...projectsFlag, enabled: true }));
    configure({
      featureFlagsControllerFindAll: vi.fn(() => of([projectsFlag])) as never,
      featureFlagsControllerUpdate: update as never,
    });

    const fixture = TestBed.createComponent(FeatureFlags);
    await fixture.whenStable();

    const toggle = fixture.nativeElement.querySelector('button[role="switch"]') as HTMLButtonElement;
    toggle.click();
    await fixture.whenStable();

    expect(update).toHaveBeenCalledWith('PROJECTS', { enabled: true });
  });

  it('shows a session-expired message on a 401 load error', async () => {
    configure({
      featureFlagsControllerFindAll: vi.fn(() => throwError(() => new HttpErrorResponse({ status: 401 }))) as never,
    });

    const fixture = TestBed.createComponent(FeatureFlags);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Your session has expired');
  });
});
