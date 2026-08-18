import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideDynamicIcon, type LucideIconInput } from '@lucide/angular';
import { Card } from '../../layout/card/card.component';

@Component({
  selector: 'ui-stat-card',
  imports: [Card, LucideDynamicIcon],
  templateUrl: './stat-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly icon = input.required<LucideIconInput>();
  readonly hint = input<string>();
  readonly loading = input(false);
}
