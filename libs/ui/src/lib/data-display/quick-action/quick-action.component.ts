import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideChevronRight, LucideDynamicIcon, type LucideIconInput } from '@lucide/angular';

/** Attribute component so the host app can supply `routerLink`/`href` or a click handler. */
@Component({
  selector: 'a[uiQuickAction], button[uiQuickAction]',
  imports: [LucideDynamicIcon],
  templateUrl: './quick-action.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'border-border-subtle bg-glass-active hover:border-accent active:border-accent active:bg-glass focus-visible:outline-accent flex w-full cursor-pointer items-center gap-3 rounded-md border p-3 text-left no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
  },
})
export class QuickAction {
  readonly icon = input.required<LucideIconInput>();
  readonly description = input<string>();

  protected readonly chevron = LucideChevronRight;
}
