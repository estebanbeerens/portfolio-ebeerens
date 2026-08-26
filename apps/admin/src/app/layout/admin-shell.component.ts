import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AmbientBackdrop, NavItem, Sidenav, Toast, ThemeToggle, UserBadge } from '@portfolio-ebeerens/ui';
import { LucideDynamicIcon, LucideLogOut, LucideMenu } from '@lucide/angular';
import { filter, map } from 'rxjs';
import { SessionService } from '../auth/session.service';
import { ADMIN_NAV } from './nav.config';

@Component({
  selector: 'admin-shell',
  imports: [
    AmbientBackdrop,
    LucideDynamicIcon,
    NavItem,
    RouterLink,
    RouterOutlet,
    Sidenav,
    Toast,
    ThemeToggle,
    UserBadge,
  ],
  templateUrl: './admin-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShell {
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);

  protected readonly navItems = ADMIN_NAV;
  protected readonly menuIcon = LucideMenu;
  protected readonly logoutIcon = LucideLogOut;
  protected readonly navOpen = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  protected readonly adminName = computed(
    () => this.session.displayName() ?? this.session.githubUserId() ?? 'Administrator'
  );
  protected readonly adminAvatarUrl = this.session.avatarUrl;

  protected isActive(route: string): boolean {
    return this.url().split('?')[0] === route;
  }

  protected toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  protected closeNav(): void {
    this.navOpen.set(false);
  }

  protected skipToMain(event: Event): void {
    event.preventDefault();
    const el = document.getElementById('main');
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  protected logout(): void {
    this.session.logout();
  }
}
