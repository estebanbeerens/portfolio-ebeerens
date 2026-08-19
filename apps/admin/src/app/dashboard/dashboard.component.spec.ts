import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  ActivityAction,
  ActivityEntity,
  DashboardService as DashboardApi,
  type DashboardSummaryDto,
} from '@portfolio-ebeerens/api-client';
import { Dashboard } from './dashboard.component';
import { DASHBOARD_QUICK_ACTIONS } from './dashboard.config';

const summary: DashboardSummaryDto = {
  totalProjects: 8,
  totalSkills: 24,
  yearsExperience: 7,
  experienceStartDate: '2017-06-01T00:00:00.000Z',
  resumeDownloadsLast30Days: 156,
  recentActivity: [
    {
      id: 'a1',
      entityType: ActivityEntity.Role,
      action: ActivityAction.Created,
      summary: 'Added role "Lead Frontend Dev" at Nebula Labs',
      actor: 'Alex Mercer',
      createdAt: new Date().toISOString(),
    },
  ],
};

describe('Dashboard', () => {
  function configure(api: Partial<DashboardApi>) {
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), { provide: DashboardApi, useValue: api }],
    });
  }

  it('renders live stat values once the summary resolves', async () => {
    configure({ dashboardControllerGetSummary: () => of(summary) as never });

    const fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('8');
    expect(text).toContain('24');
    expect(text).toContain('156');
    expect(text).toContain('7+');
    expect(text).toContain('Since June 2017');
  });

  it('renders the recent activity summary from the API', async () => {
    configure({ dashboardControllerGetSummary: () => of(summary) as never });

    const fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('[role="listitem"]')).toHaveLength(1);
    expect(compiled.textContent).toContain('Added role "Lead Frontend Dev" at Nebula Labs');
    expect(compiled.textContent).toContain('Alex Mercer');
  });

  it('shows an empty message when nothing has been recorded', async () => {
    configure({ dashboardControllerGetSummary: () => of({ ...summary, recentActivity: [] }) as never });

    const fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No changes recorded yet.');
  });

  it('shows a retry affordance when the summary fails to load', async () => {
    configure({ dashboardControllerGetSummary: () => throwError(() => new Error('500')) as never });

    const fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain("Couldn't load recent updates.");
    expect(text).toContain('Try again');
  });

  it('always renders the quick actions', async () => {
    configure({ dashboardControllerGetSummary: () => of(summary) as never });

    const fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('a[uiQuickAction]')).toHaveLength(
      DASHBOARD_QUICK_ACTIONS.length
    );
  });

  it('fetches fresh data on every navigation to the route instead of reusing a stale singleton', async () => {
    const getSummary = vi
      .fn()
      .mockReturnValueOnce(of(summary))
      .mockReturnValueOnce(of({ ...summary, totalProjects: 9 }));
    configure({ dashboardControllerGetSummary: getSummary as never });

    const first = TestBed.createComponent(Dashboard);
    await first.whenStable();
    expect((first.nativeElement as HTMLElement).textContent).toContain('8');
    first.destroy();

    // Simulates navigating away and back: a new routed component instance gets its own DashboardDataService.
    const second = TestBed.createComponent(Dashboard);
    await second.whenStable();

    expect(getSummary).toHaveBeenCalledTimes(2);
    expect((second.nativeElement as HTMLElement).textContent).toContain('9');
  });
});
