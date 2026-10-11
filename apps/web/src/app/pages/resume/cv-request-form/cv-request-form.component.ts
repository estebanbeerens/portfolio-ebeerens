import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideDownload, LucideDynamicIcon } from '@lucide/angular';
import { Button, TextInput, Textarea } from '@portfolio-ebeerens/ui';
import { NgxTurnstileComponent } from 'ngx-turnstile';

export interface CvFormValue {
  fullName?: string;
  email?: string;
  reason?: string;
  consent?: boolean;
  turnstileToken?: string;
}

@Component({
  selector: 'web-cv-request-form',
  imports: [ReactiveFormsModule, RouterLink, Button, TextInput, Textarea, LucideDynamicIcon, NgxTurnstileComponent],
  templateUrl: './cv-request-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvRequestForm {
  readonly saving = input(false);
  readonly siteKey = input<string>();
  readonly resetToken = input(0);
  readonly submitted = output<CvFormValue>();
  protected readonly downloadIcon = LucideDownload;
  protected readonly token = signal<string | undefined>(undefined);
  protected readonly error = signal<string | undefined>(undefined);
  private readonly turnstile = viewChild<NgxTurnstileComponent>('turnstile');
  protected readonly form = inject(FormBuilder).nonNullable.group({
    fullName: ['', Validators.maxLength(200)],
    email: ['', [Validators.email, Validators.maxLength(254)]],
    reason: ['', Validators.maxLength(500)],
    consent: [false],
  });
  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly hasDetails = computed(() =>
    Boolean(this.value().fullName?.trim() || this.value().email?.trim() || this.value().reason?.trim())
  );
  protected readonly consented = computed(() => this.value().consent === true);

  constructor() {
    effect(() => {
      if (this.saving()) this.form.disable({ emitEvent: false });
      else this.form.enable({ emitEvent: false });
    });
    effect(() => {
      this.resetToken();
      this.token.set(undefined);
      this.turnstile()?.reset();
    });
  }

  protected fieldError(name: 'fullName' | 'email' | 'reason'): string | undefined {
    const control = this.form.controls[name];
    return control.invalid && control.touched
      ? $localize`:@@cv.form.fieldError:Check this field's format and length.`
      : undefined;
  }

  protected submit(): void {
    if (this.saving()) return;
    this.error.set(undefined);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set($localize`:@@cv.form.invalid:Check the highlighted fields, or download anonymously.`);
      return;
    }
    const value = this.form.getRawValue();
    if (!this.hasDetails()) {
      this.submitted.emit({});
      return;
    }
    if (!value.consent) {
      this.error.set(
        $localize`:@@cv.form.consentRequired:Agree to storing your optional details, or leave the fields empty to download anonymously.`
      );
      return;
    }
    if (!this.siteKey() || !this.token()) {
      this.error.set(
        $localize`:@@cv.form.verificationRequired:Complete verification to share details, or leave the fields empty to download anonymously.`
      );
      return;
    }
    this.submitted.emit({
      ...(value.fullName.trim() ? { fullName: value.fullName.trim() } : {}),
      ...(value.email.trim() ? { email: value.email.trim() } : {}),
      ...(value.reason.trim() ? { reason: value.reason.trim() } : {}),
      consent: true,
      turnstileToken: this.token(),
    });
  }
}
