import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Attribute component so the host app can use a native `<button>` or `<a>` (with its own
 * click handler / href / routerLink) while this library only supplies the visual treatment.
 */
@Component({
  selector: 'button[uiButton], a[uiButton]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()',
  },
})
export class Button {
  readonly variant = input<'filled' | 'outlined'>('filled');
  readonly tone = input<'default' | 'danger'>('default');

  protected readonly hostClass = computed(() => {
    const base =
      'focus-visible:outline-accent inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

    const styles: Record<'filled' | 'outlined', Record<'default' | 'danger', string>> = {
      filled: {
        default: 'bg-accent hover:bg-accent-hover active:bg-accent-hover text-neutral-0 dark:text-neutral-950',
        danger: 'bg-error text-neutral-0 dark:text-neutral-950 hover:opacity-90 active:opacity-80',
      },
      outlined: {
        default: 'border-border hover:bg-glass active:bg-glass-active border',
        danger: 'text-error border-error/40 hover:bg-error/10 active:bg-error/20 border',
      },
    };

    return [base, styles[this.variant()][this.tone()]].join(' ');
  });
}
