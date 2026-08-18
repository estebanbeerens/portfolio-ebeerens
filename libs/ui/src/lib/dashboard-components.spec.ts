import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LucideFolder } from '@lucide/angular';
import { axe } from 'vitest-axe';
import { ActivityItem, ActivityList, QuickAction, StatCard } from './data-display';
import { Card, PageHeader } from './layout';
import { NavItem, Sidenav, UserBadge } from './navigation';

@Component({
  imports: [ActivityItem, ActivityList, Card, NavItem, PageHeader, QuickAction, Sidenav, StatCard, UserBadge],
  template: `
    <ui-sidenav label="Admin sections" [open]="true">
      <a sidenavBrand href="/">Alex Mercer</a>
      <a uiNavItem href="/dashboard" [icon]="icon" [active]="true">Dashboard</a>
      <a uiNavItem href="/projects" [icon]="icon">Projects</a>
      <div sidenavFooter><ui-user-badge name="Alex Mercer" status="Admin Session" /></div>
    </ui-sidenav>

    <main>
      <ui-page-header title="Dashboard" subtitle="Overview" />
      <ui-stat-card label="Total projects" value="8" hint="3 featured artifacts" [icon]="icon" />
      <ui-card heading="Recent Updates">
        <ui-activity-list>
          <ui-activity-item [icon]="icon" title="Added a role" meta="2 hours ago" />
        </ui-activity-list>
      </ui-card>
      <ui-card heading="Quick Actions">
        <a uiQuickAction href="/basic-info" [icon]="icon" description="Basic Info">Edit Personal Summary</a>
      </ui-card>
    </main>
  `,
})
export class DashboardHarness {
  protected readonly icon = LucideFolder;
}

describe('dashboard UI components', () => {
  async function render() {
    const fixture = TestBed.createComponent(DashboardHarness);
    await fixture.whenStable();
    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DashboardHarness] }).compileComponents();
  });

  it('marks the active nav item with aria-current', async () => {
    const fixture = await render();
    const items = fixture.nativeElement.querySelectorAll('a[uiNavItem]');

    expect(items[0].getAttribute('aria-current')).toBe('page');
    expect(items[1].getAttribute('aria-current')).toBeNull();
  });

  it('exposes the sidenav as a labelled navigation landmark', async () => {
    const fixture = await render();
    const nav = fixture.nativeElement.querySelector('nav');

    expect(nav?.getAttribute('aria-label')).toBe('Admin sections');
  });

  it('renders stat, activity and quick action content', async () => {
    const fixture = await render();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Total projects');
    expect(text).toContain('3 featured artifacts');
    expect(text).toContain('Added a role');
    expect(text).toContain('Edit Personal Summary');
  });

  it('renders the card heading as a level-2 heading below the page title', async () => {
    const fixture = await render();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Dashboard');
    expect(compiled.querySelector('h2')?.textContent).toContain('Recent Updates');
  });

  it('falls back to initials when no avatar is provided', async () => {
    const fixture = await render();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('AM');
  });

  it('has no accessibility violations', async () => {
    const fixture = await render();

    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
