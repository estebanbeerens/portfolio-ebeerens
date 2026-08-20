import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SocialPlatform } from './social-link.model';

@Component({
  selector: 'web-social-icon',
  templateUrl: './social-icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class SocialIcon {
  readonly platform = input.required<SocialPlatform>();
}
