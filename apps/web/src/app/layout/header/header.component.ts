import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProfileDto } from '@portfolio-ebeerens/api-client';
import { ThemeToggle } from '@portfolio-ebeerens/ui';
import { PortfolioContentService } from '../../shared/portfolio-content.service';

@Component({
  selector: 'web-header',
  imports: [RouterLink, RouterLinkActive, ThemeToggle],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'fixed inset-x-0 top-0 z-50 block' },
})
export class Header {
  readonly profile = input<ProfileDto | undefined>();
  protected readonly content = inject(PortfolioContentService);
}
