import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideDynamicIcon, type LucideIconInput } from '@lucide/angular';

/**
 * Attribute component so the host app can supply `routerLink`/`href` without
 * pulling the router into this library.
 */
@Component({
  selector: 'a[uiNavItem], button[uiNavItem]',
  imports: [LucideDynamicIcon],
  templateUrl: './nav-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
    '[attr.aria-current]': "active() ? 'page' : null",
  },
})
export class NavItem {
  readonly icon = input.required<LucideIconInput>();
  readonly active = input(false);
  readonly badge = input<number | undefined>();

  protected readonly hostClass = computed(() =>
    [
      'focus-visible:outline-accent flex w-full cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-left no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
      this.active()
        ? 'border-border-subtle bg-glass-active text-text font-semibold'
        : 'border-transparent text-text-muted hover:bg-glass hover:text-text active:bg-glass-active font-medium',
    ].join(' ')
  );
}
