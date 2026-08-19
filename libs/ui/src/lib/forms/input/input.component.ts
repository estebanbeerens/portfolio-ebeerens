import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ThemeService } from '../../theming/theme.service';
import { FormField } from '../form-field/form-field.component';

export type TextInputType = 'text' | 'email' | 'url' | 'date' | 'number';

/**
 * Reusable text-like input (`text`/`email`/`url`/`date`/`number`) with label/hint/error chrome.
 */
@Component({
  selector: 'ui-input',
  imports: [FormField],
  templateUrl: './input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInput),
      multi: true,
    },
  ],
})
export class TextInput implements ControlValueAccessor {
  private readonly themeService = inject(ThemeService);

  readonly controlId = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input<TextInputType>('text');
  readonly placeholder = input('');
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly required = input(false);
  readonly autocomplete = input('off');

  protected readonly value = signal('');
  protected readonly disabled = signal(false);
  // Native date pickers need an explicit color-scheme to render legibly in dark mode.
  protected readonly colorScheme = computed(() => (this.type() === 'date' ? this.themeService.theme() : null));

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
