import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LucideUser } from '@lucide/angular';
import { NavItem } from './nav-item.component';

@Component({
  imports: [NavItem],
  template: `
    <a uiNavItem [icon]="icon" [badge]="badge">Dashboard</a>
    <a uiNavItem [icon]="icon">No badge</a>
  `,
})
class HostComponent {
  readonly icon = LucideUser;
  badge: number | undefined;
}

describe('NavItem', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('does not render a badge when unset or zero', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const [withBadge] = fixture.nativeElement.querySelectorAll('a');
    expect(withBadge.querySelector('.bg-accent.rounded-full')).toBeNull();

    fixture.componentInstance.badge = 0;
    fixture.detectChanges();
    expect(withBadge.querySelector('.bg-accent.rounded-full')).toBeNull();
  });

  it('renders the badge count when greater than zero', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.badge = 3;
    await fixture.whenStable();
    fixture.detectChanges();

    const [withBadge] = fixture.nativeElement.querySelectorAll('a');
    expect(withBadge.querySelector('.bg-accent.rounded-full')?.textContent?.trim()).toBe('3');
  });
});
