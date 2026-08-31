import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PublicProfileDto } from '@portfolio-ebeerens/api-client';
import { Card } from '@portfolio-ebeerens/ui';
import { SocialIcon } from '../../../shared/social-links/social-icon.component';
import { socialLinksFor } from '../../../shared/social-links/social-link.model';

@Component({
  selector: 'web-basic-info-card',
  imports: [Card, SocialIcon],
  templateUrl: './basic-info-card.component.html',
  styleUrl: './basic-info-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicInfoCard {
  readonly profile = input<PublicProfileDto | undefined>();
  protected readonly socialLinks = computed(() => socialLinksFor(this.profile()));
}
