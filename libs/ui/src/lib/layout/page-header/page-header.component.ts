import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-page-header',
  templateUrl: './page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex w-full flex-wrap items-start justify-between gap-4' },
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
