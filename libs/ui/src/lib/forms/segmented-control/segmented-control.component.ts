import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

export interface SegmentedControlOption {
  value: string;
  label: string;
  panelId?: string;
  disabled?: boolean;
}

@Component({
  selector: 'ui-segmented-control',
  imports: [],
  templateUrl: './segmented-control.component.html',
  styleUrl: './segmented-control.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedControl {
  readonly label = input.required<string>();
  readonly options = input.required<readonly SegmentedControlOption[]>();
  readonly selected = model.required<string>();

  protected readonly selectedIndex = computed(() => {
    const index = this.options().findIndex((option) => option.value === this.selected());
    return Math.max(0, index);
  });

  protected select(option: SegmentedControlOption): void {
    if (option.disabled) {
      return;
    }
    this.selected.set(option.value);
  }
}
