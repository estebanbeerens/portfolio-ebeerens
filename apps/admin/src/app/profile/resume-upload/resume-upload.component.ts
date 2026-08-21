import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ResumeService } from '@portfolio-ebeerens/api-client';
import { Card, FileDropzone, ToastService } from '@portfolio-ebeerens/ui';
import { LucideDynamicIcon, LucideFileText, LucideTrash2 } from '@lucide/angular';
import { firstValueFrom } from 'rxjs';

const RESUME_MIME_TYPE = 'application/pdf';
const RESUME_MAX_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'admin-resume-upload',
  imports: [Card, DatePipe, FileDropzone, LucideDynamicIcon],
  templateUrl: './resume-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumeUpload {
  private readonly api = inject(ResumeService);
  private readonly toast = inject(ToastService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly fileIcon = LucideFileText;
  protected readonly trashIcon = LucideTrash2;

  protected readonly resource = rxResource({
    params: () => (this.isBrowser ? true : undefined),
    stream: () => this.api.resumeControllerFindResume(),
  });
  protected readonly resume = computed(() => (this.resource.hasValue() ? this.resource.value() : undefined));
  protected readonly isLoading = computed(() => !this.resource.hasValue() && !this.resource.error());
  protected readonly requestError = computed(() => {
    const error = this.resource.error();
    if (error instanceof HttpErrorResponse && error.status === 404) {
      return undefined;
    }
    return error ? 'The current resume could not be loaded.' : undefined;
  });

  protected readonly uploading = signal(false);
  protected readonly deleting = signal(false);
  protected readonly busy = computed(() => this.uploading() || this.deleting());

  protected async uploadResume(file: File): Promise<void> {
    if (this.busy()) {
      return;
    }
    if (file.type !== RESUME_MIME_TYPE) {
      this.toast.error('Only PDF files are supported for the resume.');
      return;
    }
    if (file.size > RESUME_MAX_BYTES) {
      this.toast.error('The resume must be 5MB or smaller.');
      return;
    }

    this.uploading.set(true);
    try {
      const { uploadUrl, objectKey } = await firstValueFrom(
        this.api.resumeControllerCreateUploadUrl({ fileName: file.name, mimeType: file.type, fileSize: file.size })
      );
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      await firstValueFrom(
        this.api.resumeControllerConfirmUpload({
          objectKey,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        })
      );
      this.toast.success('Resume uploaded.');
      this.resource.reload();
    } catch {
      this.toast.error('The resume could not be uploaded. Try again.');
    } finally {
      this.uploading.set(false);
    }
  }

  protected removeResume(): void {
    if (this.busy()) {
      return;
    }
    this.deleting.set(true);
    this.api.resumeControllerRemove().subscribe({
      next: () => {
        this.deleting.set(false);
        this.toast.success('Resume deleted.');
        this.resource.reload();
      },
      error: () => {
        this.deleting.set(false);
        this.toast.error('The resume could not be deleted. Try again.');
      },
    });
  }

  protected fileSizeLabel(bytes: number): string {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
}
