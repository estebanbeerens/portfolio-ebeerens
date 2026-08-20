import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button, Card, TextInput, Textarea } from '@portfolio-ebeerens/ui';
import { ContactService, CreateContactMessageDto } from '@portfolio-ebeerens/api-client';
import { NgxTurnstileComponent } from 'ngx-turnstile';
import { catchError, finalize, of } from 'rxjs';
import { BasicInfoCard } from '../../home/components/basic-info-card/basic-info-card.component';
import { PortfolioContentService } from '../../shared/portfolio-content.service';

type RuntimeConfig = {
  turnstileSiteKey?: string;
};

type SubmissionState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'web-contact-page',
  imports: [ReactiveFormsModule, TextInput, Textarea, Button, Card, BasicInfoCard, NgxTurnstileComponent],
  templateUrl: './contact-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly contactService = inject(ContactService);
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly content = inject(PortfolioContentService);

  private readonly turnstile = viewChild<{ reset: () => void }>('turnstile');
  protected readonly turnstileToken = signal<string | undefined>(undefined);
  protected readonly submissionState = signal<SubmissionState>('idle');
  protected readonly submittedInvalid = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    organization: ['', [Validators.maxLength(200)]],
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.maxLength(5000)]],
  });

  private readonly runtimeConfig = rxResource({
    params: () => (this.isBrowser ? true : undefined),
    stream: () => this.http.get<RuntimeConfig>('/runtime-config.json').pipe(catchError(() => of({} as RuntimeConfig))),
  });

  protected readonly turnstileSiteKey = computed(() => this.runtimeConfig.value()?.turnstileSiteKey || undefined);
  protected readonly statusMessage = computed(() => {
    if (!this.turnstileSiteKey()) {
      return 'Verification is unavailable right now.';
    }
    if (this.submissionState() === 'submitting') {
      return 'Sending your message...';
    }
    if (this.submissionState() === 'success') {
      return 'Your message was sent.';
    }
    if (this.submissionState() === 'error') {
      return 'Something went wrong. Please try again.';
    }
    if (this.submittedInvalid() && this.form.invalid) {
      return 'Complete the required fields before sending.';
    }
    if (!this.turnstileToken()) {
      return 'Complete the verification before sending.';
    }
    return 'Verification complete.';
  });

  protected fieldError(controlName: keyof typeof this.form.controls, message: string): string | undefined {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched) ? message : undefined;
  }

  protected onTurnstileResolved(token: string | null): void {
    this.turnstileToken.set(token || undefined);
    if (!token && this.submissionState() !== 'submitting') {
      this.submissionState.set('idle');
    }
  }

  protected onTurnstileProblem(): void {
    this.turnstileToken.set(undefined);
    if (this.submissionState() !== 'submitting') {
      this.submissionState.set('idle');
    }
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    this.submittedInvalid.set(false);
    const token = this.turnstileToken();
    if (this.form.invalid) {
      this.submittedInvalid.set(true);
      return;
    }
    if (!token || !this.turnstileSiteKey()) {
      return;
    }

    this.submissionState.set('submitting');
    this.form.disable();
    const value = this.form.getRawValue();
    const payload: CreateContactMessageDto = {
      fullName: value.fullName,
      email: value.email,
      ...(value.organization ? { organization: value.organization } : {}),
      subject: value.subject,
      message: value.message,
      turnstileToken: token,
    };

    this.contactService
      .contactControllerCreate(payload, 'body', false, { transferCache: false })
      .pipe(finalize(() => this.form.enable()))
      .subscribe({
        next: () => {
          this.submissionState.set('success');
          this.form.reset();
          this.turnstileToken.set(undefined);
          this.turnstile()?.reset();
        },
        error: () => {
          this.submissionState.set('error');
          this.turnstileToken.set(undefined);
          this.turnstile()?.reset();
        },
      });
  }
}
