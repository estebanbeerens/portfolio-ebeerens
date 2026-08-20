import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'ui-markdown',
  imports: [MarkdownComponent],
  template: '<markdown [data]="source()" ngPreserveWhitespaces />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class Markdown {
  readonly source = input.required<string>();
}
