import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Label/hint/error chrome shared by the form-field components; projects the native control.
 */
@Component({
  selector: 'ui-form-field',
  templateUrl: './form-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class FormField {
  readonly label = input.required<string>();
  readonly for = input.required<string>();
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly required = input(false);
}
