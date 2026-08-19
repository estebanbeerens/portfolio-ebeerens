import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'ui-toggle',
  templateUrl: './toggle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toggle {
  readonly checked = input(false);
  readonly disabled = input(false);
  readonly label = input.required<string>();
  /** When true, extends the clickable hit area to fill the nearest `relative` ancestor. */
  readonly stretched = input(false);

  readonly toggled = output<boolean>();

  protected readonly buttonClass = computed(() => {
    const base =
      'inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
    // Neutral-200/700 (not bg-surface) so the unchecked trail clears 3:1 against the white thumb.
    const state = this.checked()
      ? 'bg-accent border-accent hover:bg-accent-hover active:bg-accent-hover'
      : 'bg-neutral-200 border-border hover:bg-neutral-300 active:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:active:bg-neutral-600';
    const stretch = this.stretched() ? "before:absolute before:inset-0 before:content-['']" : '';
    return [base, state, stretch].filter(Boolean).join(' ');
  });

  protected onClick(): void {
    if (this.disabled()) {
      return;
    }
    this.toggled.emit(!this.checked());
  }
}
