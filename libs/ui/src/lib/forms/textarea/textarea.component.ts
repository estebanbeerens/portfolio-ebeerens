import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormField } from '../form-field/form-field.component';

/**
 * Reusable multi-line text field with label/hint/error chrome.
 */
@Component({
  selector: 'ui-textarea',
  imports: [FormField],
  templateUrl: './textarea.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Textarea),
      multi: true,
    },
  ],
})
export class Textarea implements ControlValueAccessor {
  readonly controlId = input.required<string>();
  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly required = input(false);
  readonly rows = input(4);
  readonly maxlength = input<number>();

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

  protected onInput(value: string): void {
    this.value.set(value);
    this.onChange(value);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
