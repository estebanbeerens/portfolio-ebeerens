import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormField } from '../form-field/form-field.component';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

/**
 * Reusable native `<select>` with label/hint/error chrome, matching TextInput's CVA shape.
 */
@Component({
  selector: 'ui-select',
  imports: [FormField],
  templateUrl: './select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Select),
      multi: true,
    },
  ],
})
export class Select implements ControlValueAccessor {
  readonly controlId = input.required<string>();
  readonly label = input.required<string>();
  readonly options = input.required<SelectOption[]>();
  readonly placeholder = input('');
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly required = input(false);

  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onSelect(value: string): void {
    this.value.set(value);
    this.onChange(value);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
