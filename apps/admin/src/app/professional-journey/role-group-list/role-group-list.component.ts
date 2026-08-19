import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { OrganizationDto, RoleDto } from '@portfolio-ebeerens/api-client';
import { Button, Card } from '@portfolio-ebeerens/ui';
import { employmentTypeLabel } from '../employment-type';

export interface RoleGroup {
  organization: OrganizationDto;
  roles: RoleDto[];
}

export interface OrganizationUpdate {
  id: string;
  logoUrl: string;
  website: string;
}

/**
 * Presentational, organization-grouped role list: loading/error/empty states plus create/edit/delete triggers.
 */
@Component({
  selector: 'admin-role-group-list',
  imports: [Button, Card, DatePipe],
  templateUrl: './role-group-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-1' },
})
export class RoleGroupList {
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
  protected readonly websiteDraft = signal('');

  protected readonly employmentTypeLabel = employmentTypeLabel;

  protected beginEditOrganization(organization: OrganizationDto): void {
    this.editingOrganizationId.set(organization.id);
    this.logoUrlDraft.set(organization.logoUrl ?? '');
    this.websiteDraft.set(organization.website ?? '');
  }

  protected cancelEditOrganization(): void {
    this.editingOrganizationId.set(undefined);
  }

  protected saveOrganization(id: string): void {
    this.updateOrganization.emit({ id, logoUrl: this.logoUrlDraft(), website: this.websiteDraft() });
    this.editingOrganizationId.set(undefined);
  }
}
