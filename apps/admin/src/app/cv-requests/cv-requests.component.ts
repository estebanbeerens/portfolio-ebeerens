import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CvRequestDto, ResumeService } from '@portfolio-ebeerens/api-client';
import { Button, PageHeader, ToastService } from '@portfolio-ebeerens/ui';
import { CvRequestList } from './cv-request-list.component';

@Component({
  selector: 'admin-cv-requests',
  imports: [CvRequestList, Button, PageHeader],
  templateUrl: './cv-requests.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvRequests {
  private readonly api = inject(ResumeService);
  private readonly toast = inject(ToastService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly confirmation = viewChild<ElementRef<HTMLDialogElement>>('confirmation');
  protected readonly offset = signal(0);
  protected readonly pendingDelete = signal<CvRequestDto | undefined>(undefined);
  protected readonly deleting = signal(false);
  protected readonly resource = rxResource({
    params: () => (this.isBrowser ? this.offset() : undefined),
    stream: ({ params }) => this.api.resumeControllerFindRequests(params, 'body', false, { transferCache: false }),
  });
  protected readonly page = computed(() => (this.resource.hasValue() ? this.resource.value() : undefined));
  protected readonly error = computed(() =>
    this.resource.error() ? 'CV requests could not be loaded. Check your session and retry.' : undefined
  );

  constructor() {
    effect(() => {
      const pending = this.pendingDelete();
      const dialog = this.confirmation()?.nativeElement;
      if (!this.isBrowser || !dialog) return;
      if (pending && !dialog.open) dialog.showModal();
      else if (!pending && dialog.open) dialog.close();
    });
  }

  protected cancelDelete(): void {
    if (!this.deleting()) this.pendingDelete.set(undefined);
  }

  protected remove(): void {
    const request = this.pendingDelete();
    if (!request || this.deleting()) return;
    this.deleting.set(true);
    this.api.resumeControllerRemoveRequest(request.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDelete.set(undefined);
        if (this.page()?.items.length === 1 && this.offset() > 0) this.offset.update((offset) => offset - 25);
        else this.resource.reload();
        this.toast.success('CV request deleted.');
      },
      error: () => {
        this.deleting.set(false);
        this.toast.error('The CV request could not be deleted. Try again.');
      },
    });
  }
}
