import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  LOCALE_ID,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Meta } from '@angular/platform-browser';
import { ResumeService } from '@portfolio-ebeerens/api-client';
import { Card } from '@portfolio-ebeerens/ui';
import { catchError, finalize, of } from 'rxjs';
import { CvFormValue, CvRequestForm } from './cv-request-form/cv-request-form.component';

@Component({
  selector: 'web-resume-page',
  imports: [Card, CvRequestForm],
  templateUrl: './resume-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumePage {
  private readonly api = inject(ResumeService);
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly locale = inject(LOCALE_ID).startsWith('nl') ? 'nl' : 'en';
  private readonly errorBanner = viewChild<ElementRef<HTMLElement>>('downloadError');
  protected readonly saving = signal(false);
  protected readonly resetToken = signal(0);
  protected readonly status = signal<string | undefined>(undefined);
  protected readonly error = signal<string | undefined>(undefined);
  private readonly config = rxResource({
    params: () => (this.isBrowser ? true : undefined),
    stream: () =>
      this.http
        .get<{ turnstileSiteKey?: string }>('/runtime-config.json')
        .pipe(catchError(() => of({ turnstileSiteKey: undefined }))),
  });
  protected readonly siteKey = computed(() => this.config.value()?.turnstileSiteKey || undefined);

  constructor() {
    const meta = inject(Meta);
    meta.updateTag({ name: 'description', content: 'Download the CV of Esteban Beerens.' });
    effect(() => {
      if (this.error()) this.errorBanner()?.nativeElement.focus();
    });
  }

  protected download(value: CvFormValue): void {
    if (!this.isBrowser || this.saving()) return;
    this.saving.set(true);
    this.error.set(undefined);
    this.status.set($localize`:@@cv.status.preparing:Preparing your CV...`);
    this.api
      .resumeControllerRequestDownload(value, this.locale, 'body', false, { transferCache: false })
      .pipe(
        finalize(() => {
          this.saving.set(false);
          this.resetToken.update((token) => token + 1);
        })
      )
      .subscribe({
        next: (result) => {
          const link = this.document.createElement('a');
          link.href = result.downloadUrl;
          link.download = `cv-${this.locale}.pdf`;
          link.hidden = true;
          this.document.body.appendChild(link);
          link.click();
          link.remove();
          this.status.set(
            result.loggingStatus === 'failed'
              ? $localize`:@@cv.status.loggingFailed:Your CV is ready, but your optional details could not be saved.`
              : $localize`:@@cv.status.ready:Your CV is ready.`
          );
        },
        error: () => {
          this.status.set(undefined);
          this.error.set($localize`:@@cv.status.error:The CV could not be downloaded. Please try again.`);
        },
      });
  }
}
