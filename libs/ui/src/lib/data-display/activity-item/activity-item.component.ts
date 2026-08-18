import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideDynamicIcon, type LucideIconInput } from '@lucide/angular';

@Component({
  selector: 'ui-activity-item',
  imports: [LucideDynamicIcon],
  templateUrl: './activity-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex w-full items-center gap-3',
    role: 'listitem',
  },
})
export class ActivityItem {
  readonly icon = input.required<LucideIconInput>();
  readonly title = input.required<string>();
  readonly meta = input<string>();
}
