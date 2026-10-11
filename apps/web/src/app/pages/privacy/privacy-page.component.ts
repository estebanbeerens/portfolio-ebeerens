import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'web-privacy-page',
  templateUrl: './privacy-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPage {}
