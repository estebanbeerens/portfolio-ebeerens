import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  CreateOrganizationLogoUploadUrlDto,
  OrganizationDto,
  OrganizationsService,
  RoleDto,
} from '@portfolio-ebeerens/api-client';
import { Button, Card, FileDropzone, ToastService } from '@portfolio-ebeerens/ui';
import { firstValueFrom } from 'rxjs';
import { employmentTypeLabel } from '../employment-type';

const ORGANIZATION_LOGO_MIME_TYPES: readonly string[] = Object.values(CreateOrganizationLogoUploadUrlDto.MimeTypeEnum);
const ORGANIZATION_LOGO_MAX_BYTES = 5 * 1024 * 1024;

export interface RoleGroup {
  organization: OrganizationDto;
  roles: RoleDto[];
}

export interface OrganizationUpdate {
  id: string;
  logoUrl: string;
  logoObjectKey: string;
  website: string;
}

/**
 * Presentational, organization-grouped role list: loading/error/empty states plus create/edit/delete triggers.
 */
@Component({
  selector: 'admin-role-group-list',
  imports: [Button, Card, DatePipe, FileDropzone],
  templateUrl: './role-group-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-1' },
})
export class RoleGroupList {
  private readonly organizationsApi = inject(OrganizationsService);
  private readonly toast = inject(ToastService);

  readonly groups = input<RoleGroup[]>();
  readonly loading = input(false);
  readonly error = input<string>();

  readonly create = output<void>();
  readonly edit = output<RoleDto>();
  readonly delete = output<RoleDto>();
  readonly retry = output<void>();
  readonly updateOrganization = output<OrganizationUpdate>();

  protected readonly editingOrganizationId = signal<string | undefined>(undefined);
  protected readonly logoUrlDraft = signal('');
  protected readonly logoObjectKeyDraft = signal('');
  protected readonly websiteDraft = signal('');
  protected readonly logoUploading = signal(false);

  protected readonly employmentTypeLabel = employmentTypeLabel;

  protected beginEditOrganization(organization: OrganizationDto): void {
    this.editingOrganizationId.set(organization.id);
    this.logoUrlDraft.set(organization.logoUrl ?? '');
    this.logoObjectKeyDraft.set('');
    this.websiteDraft.set(organization.website ?? '');
  }

  protected cancelEditOrganization(): void {
    this.editingOrganizationId.set(undefined);
  }

  protected async uploadLogo(file: File): Promise<void> {
    if (this.logoUploading()) {
      return;
    }
    if (!ORGANIZATION_LOGO_MIME_TYPES.includes(file.type)) {
      this.toast.error('Only PNG, JPEG, or WebP images are supported.');
      return;
    }
    if (file.size > ORGANIZATION_LOGO_MAX_BYTES) {
      this.toast.error('The logo must be 5MB or smaller.');
      return;
    }

    this.logoUploading.set(true);
    try {
      const { uploadUrl, objectKey, publicUrl } = await firstValueFrom(
        this.organizationsApi.organizationsControllerCreateLogoUploadUrl({
          fileName: file.name,
          mimeType: file.type as CreateOrganizationLogoUploadUrlDto.MimeTypeEnum,
          fileSize: file.size,
        })
      );
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      this.logoUrlDraft.set(publicUrl);
      this.logoObjectKeyDraft.set(objectKey);
      this.toast.success('Logo uploaded.');
    } catch {
      this.toast.error('The logo could not be uploaded. Try again.');
    } finally {
      this.logoUploading.set(false);
    }
  }

  protected removeLogo(): void {
    this.logoUrlDraft.set('');
    this.logoObjectKeyDraft.set('');
  }

  protected saveOrganization(id: string): void {
    this.updateOrganization.emit({
      id,
      logoUrl: this.logoUrlDraft(),
      logoObjectKey: this.logoObjectKeyDraft(),
      website: this.websiteDraft(),
    });
    this.editingOrganizationId.set(undefined);
  }
}
