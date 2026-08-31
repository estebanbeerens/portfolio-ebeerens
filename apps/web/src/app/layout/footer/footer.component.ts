import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicProfileDto } from '@portfolio-ebeerens/api-client';
import { PortfolioContentService } from '../../shared/portfolio-content.service';

@Component({
  selector: 'web-footer',
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  readonly profile = input<PublicProfileDto | undefined>();
  protected readonly content = inject(PortfolioContentService);
  protected readonly currentYear = new Date().getFullYear();
}
