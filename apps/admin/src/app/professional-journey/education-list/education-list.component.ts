import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  CreateInstitutionLogoUploadUrlDto,
  EducationDto,
  InstitutionDto,
  InstitutionsService,
} from '@portfolio-ebeerens/api-client';
import { Button, Card, FileDropzone, ToastService } from '@portfolio-ebeerens/ui';
import { firstValueFrom } from 'rxjs';

const MIME_TYPES = Object.values(CreateInstitutionLogoUploadUrlDto.MimeTypeEnum);
@Component({
  selector: 'admin-education-list',
  imports: [Button, Card, DatePipe, FileDropzone],
  templateUrl: './education-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'min-w-0 flex-1' },
})
export class EducationList {
  private readonly institutionsApi = inject(InstitutionsService);
  readonly entries = input<EducationDto[]>([]);
  readonly loading = input(false);
  readonly error = input<string>();
  readonly create = output<void>();
  readonly edit = output<EducationDto>();
  readonly delete = output<EducationDto>();
  readonly retry = output<void>();
  readonly updateInstitution = output<{ id: string; logoUrl: string; logoObjectKey: string; website: string }>();
  protected readonly editingId = signal<string | undefined>(undefined);
  protected readonly logoUrl = signal('');
  protected readonly logoObjectKey = signal('');
  protected readonly website = signal('');
  protected readonly uploading = signal(false);
  private readonly toast = inject(ToastService);
  protected editInstitution(institution: InstitutionDto): void {
    this.editingId.set(institution.id);
    this.logoUrl.set(institution.logoUrl ?? '');
    this.logoObjectKey.set('');
    this.website.set(institution.website ?? '');
  }
  protected cancelInstitution(): void {
    this.editingId.set(undefined);
  }
  protected async uploadLogo(file: File): Promise<void> {
    if (!(MIME_TYPES as readonly string[]).includes(file.type)) {
      this.toast.error('Only PNG, JPEG, or WebP images are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('The logo must be 5MB or smaller.');
      return;
    }
    this.uploading.set(true);
    try {
      const result = await firstValueFrom(
        this.institutionsApi.institutionsControllerCreateLogoUploadUrl({
          fileName: file.name,
          mimeType: file.type as CreateInstitutionLogoUploadUrlDto.MimeTypeEnum,
          fileSize: file.size,
        })
      );
      await fetch(result.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      this.logoUrl.set(result.publicUrl);
      this.logoObjectKey.set(result.objectKey);
      this.toast.success('Logo uploaded.');
    } catch {
      this.toast.error('The logo could not be uploaded.');
    } finally {
      this.uploading.set(false);
    }
  }
  protected saveInstitution(id: string): void {
    this.updateInstitution.emit({
      id,
      logoUrl: this.logoUrl(),
      logoObjectKey: this.logoObjectKey(),
      website: this.website(),
    });
    this.editingId.set(undefined);
  }
}
