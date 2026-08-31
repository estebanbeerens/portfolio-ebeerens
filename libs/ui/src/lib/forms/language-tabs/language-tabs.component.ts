import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export type FormLanguage = 'en' | 'nl';

/**
 * Presentational EN/NL tab switcher for admin forms with per-language content (e.g. descriptions).
 */
@Component({
  selector: 'ui-language-tabs',
  imports: [],
  templateUrl: './language-tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageTabs {
  readonly label = input.required<string>();
  readonly panelId = input.required<string>();
  readonly language = model<FormLanguage>('en');
}
