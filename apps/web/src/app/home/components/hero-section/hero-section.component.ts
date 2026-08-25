import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProfileDto } from '@portfolio-ebeerens/api-client';
import { Button } from '@portfolio-ebeerens/ui';
import { BasicInfoCard } from '../basic-info-card/basic-info-card.component';

@Component({
  selector: 'web-hero-section',
  imports: [BasicInfoCard, Button, RouterLink],
  templateUrl: './hero-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSection {
  readonly profile = input<ProfileDto | undefined>();
}
