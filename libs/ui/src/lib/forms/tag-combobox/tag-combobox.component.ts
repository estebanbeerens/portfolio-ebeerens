import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextId = 0;

/**
 * Reusable multi-value combobox: pick from `options` or type a free-form value to add it.
 * Values are always normalized to lowercase/trimmed and de-duplicated before being emitted.
 */
@Component({
  selector: 'ui-tag-combobox',
  templateUrl: './tag-combobox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagCombobox),
      multi: true,
    },
  ],
})
export class TagCombobox implements ControlValueAccessor {
  readonly options = input<string[]>([]);
  readonly label = input('');
  readonly placeholder = input('Type to search or add...');

  protected readonly id = `ui-tag-combobox-${nextId++}`;
  protected readonly listboxId = `${this.id}-listbox`;

  protected readonly values = signal<string[]>([]);
  protected readonly query = signal('');
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly disabled = signal(false);

  protected readonly filteredOptions = computed(() => {
    const query = this.query().trim().toLowerCase();
    const selected = new Set(this.values());
    return this.options()
      .filter((option) => !selected.has(option.toLowerCase()))
      .filter((option) => !query || option.toLowerCase().includes(query));
  });

  protected readonly showCreateOption = computed(() => {
    const query = this.query().trim().toLowerCase();
    if (!query) {
      return false;
    }
    const selected = new Set(this.values());
    if (selected.has(query)) {
      return false;
    }
    return !this.options().some((option) => option.toLowerCase() === query);
  });

  protected readonly activeOptionId = computed(() => {
    const index = this.activeIndex();
    return index >= 0 ? `${this.id}-option-${index}` : null;
  });

  private onChange: (value: string[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string[] | null): void {
    this.values.set(value ?? []);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onQueryInput(value: string): void {
    this.query.set(value);
    this.open.set(true);
    this.activeIndex.set(-1);
  }

  protected onFocus(): void {
    this.open.set(true);
  }

  protected onBlur(): void {
    // Let a click on a listbox option register before closing.
    setTimeout(() => {
      this.open.set(false);
      this.onTouched();
    }, 150);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const total = this.filteredOptions().length + (this.showCreateOption() ? 1 : 0);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.open.set(true);
        this.activeIndex.set(total === 0 ? -1 : (this.activeIndex() + 1) % total);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.open.set(true);
        this.activeIndex.set(total === 0 ? -1 : (this.activeIndex() - 1 + total) % total);
        break;
      case 'Enter':
        event.preventDefault();
        this.selectActiveOrCreate();
        break;
      case 'Escape':
        this.open.set(false);
        this.activeIndex.set(-1);
        break;
      case 'Backspace':
        if (!this.query() && this.values().length > 0) {
          this.removeValue(this.values().length - 1);
        }
        break;
    }
  }

  protected selectOption(option: string): void {
    this.addValue(option);
  }

  protected createFromQuery(): void {
    this.addValue(this.query());
  }

  private selectActiveOrCreate(): void {
    const filtered = this.filteredOptions();
    const index = this.activeIndex();
    if (index >= 0 && index < filtered.length) {
      this.addValue(filtered[index]);
      return;
    }
    if (this.query().trim()) {
      this.addValue(this.query());
    }
  }

  private addValue(raw: string): void {
    const value = raw.trim().toLowerCase();
    if (!value || this.values().includes(value)) {
      this.query.set('');
      return;
    }
    const next = [...this.values(), value];
    this.values.set(next);
    this.onChange(next);
    this.query.set('');
    this.activeIndex.set(-1);
  }

  protected removeValue(index: number): void {
    const next = this.values().filter((_, i) => i !== index);
    this.values.set(next);
    this.onChange(next);
  }
}
