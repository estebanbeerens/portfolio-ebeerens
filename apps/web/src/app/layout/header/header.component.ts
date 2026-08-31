import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PublicProfileDto } from '@portfolio-ebeerens/api-client';
import { NavItem, Sidenav, ThemeToggle } from '@portfolio-ebeerens/ui';
import { LucideDynamicIcon, LucideFileText, LucideFolder, LucideHouse, LucideMail, LucideMenu } from '@lucide/angular';
import { PortfolioContentService } from '../../shared/portfolio-content.service';

@Component({
  selector: 'web-header',
  imports: [RouterLink, RouterLinkActive, ThemeToggle, Sidenav, NavItem, LucideDynamicIcon],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'fixed inset-x-0 top-0 z-50 block' },
})
export class Header {
  readonly profile = input<PublicProfileDto | undefined>();
  protected readonly content = inject(PortfolioContentService);

  protected readonly navOpen = signal(false);
  protected readonly menuIcon = LucideMenu;
  protected readonly homeIcon = LucideHouse;
  protected readonly projectsIcon = LucideFolder;
  protected readonly resumeIcon = LucideFileText;
  protected readonly contactIcon = LucideMail;

  protected toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  protected closeNav(): void {
    this.navOpen.set(false);
  }
}
