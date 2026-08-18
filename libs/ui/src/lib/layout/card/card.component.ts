import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-card',
  templateUrl: './card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'border-border bg-glass backdrop-blur-glass flex flex-col rounded-lg border',
    '[class.gap-4]': "density() === 'compact'",
    '[class.p-5]': "density() === 'compact'",
    '[class.gap-5]': "density() === 'comfortable'",
    '[class.p-6]': "density() === 'comfortable'",
  },
})
export class Card {
  readonly heading = input<string>();
  readonly density = input<'compact' | 'comfortable'>('comfortable');
}
