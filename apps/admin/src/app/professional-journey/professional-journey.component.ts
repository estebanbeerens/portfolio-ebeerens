import { HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import {
  CreateOrganizationDto,
  CreateRoleDto,
  OrganizationsService,
  RoleDto,
  RolesService,
  SkillsService,
  UpdateOrganizationDto,
} from '@portfolio-ebeerens/api-client';
import { PageHeader, ToastService } from '@portfolio-ebeerens/ui';
import { map } from 'rxjs';
import { NEW_ORGANIZATION_VALUE, RoleForm, RoleFormValue } from './role-form/role-form.component';
import { OrganizationUpdate, RoleGroup, RoleGroupList } from './role-group-list/role-group-list.component';
import { RoleDeleteDialog } from './role-delete-dialog/role-delete-dialog.component';

type Mutation = 'idle' | 'saving' | 'deleting';

@Component({
  selector: 'admin-professional-journey',
  imports: [PageHeader, RoleDeleteDialog, RoleForm, RoleGroupList],
  templateUrl: './professional-journey.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-1 flex-col gap-8' },
})
export class ProfessionalJourney {
  private readonly rolesApi = inject(RolesService);
  private readonly organizationsApi = inject(OrganizationsService);
  private readonly skillsApi = inject(SkillsService);
  private readonly toast = inject(ToastService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly skillOptions = toSignal(
    this.skillsApi.skillsControllerFindAll().pipe(map((skills) => skills.map((skill) => skill.name))),
    { initialValue: [] as string[] }
  );

  protected readonly roles = rxResource({
    params: () => (this.isBrowser ? true : undefined),
    stream: () => this.rolesApi.rolesControllerFindAll(),
  });
  protected readonly organizations = rxResource({
    params: () => (this.isBrowser ? true : undefined),
    stream: () => this.organizationsApi.organizationsControllerFindAll(),
  });

  protected readonly organizationList = computed(() =>
    this.organizations.hasValue() ? this.organizations.value() : []
  );

  protected readonly roleGroups = computed<RoleGroup[]>(() => {
    if (!this.roles.hasValue()) {
      return [];
    }
    const groups = new Map<string, RoleGroup>();
    for (const role of this.roles.value()) {
      const existing = groups.get(role.organization.id);
      if (existing) {
        existing.roles.push(role);
      } else {
        groups.set(role.organization.id, { organization: role.organization, roles: [role] });
      }
    }
    // Roles arrive sorted by startDate desc, so each group's first role is already its most recent.
    return Array.from(groups.values()).sort(
      (a, b) => new Date(b.roles[0].startDate).getTime() - new Date(a.roles[0].startDate).getTime()
    );
  });

  protected readonly formOpen = signal(false);
  protected readonly selectedRole = signal<RoleDto | undefined>(undefined);
  protected readonly pendingDelete = signal<RoleDto | undefined>(undefined);
  protected readonly mutation = signal<Mutation>('idle');
  protected readonly formError = signal<string | undefined>(undefined);
  // Bumped on every begin-create/begin-edit so `RoleForm` always resets, even create -> create.
  protected readonly formResetToken = signal(0);

  protected readonly isSaving = computed(() => this.mutation() === 'saving');
  protected readonly isDeleting = computed(() => this.mutation() === 'deleting');
  protected readonly requestError = computed(() => {
    const error = this.roles.error();
    return error instanceof HttpErrorResponse && error.status === 401
      ? 'Your session has expired. Sign in again to manage your professional journey.'
      : error
        ? 'Your professional journey could not be loaded. Try again.'
        : undefined;
  });

  protected beginCreate(): void {
    this.formOpen.set(true);
    this.selectedRole.set(undefined);
    this.formError.set(undefined);
    this.formResetToken.update((token) => token + 1);
  }

  protected beginEdit(role: RoleDto): void {
    this.formOpen.set(true);
    this.selectedRole.set(role);
    this.formError.set(undefined);
    this.formResetToken.update((token) => token + 1);
  }

  protected cancelEdit(): void {
    this.formOpen.set(false);
    this.selectedRole.set(undefined);
    this.formError.set(undefined);
  }

  protected save(value: RoleFormValue): void {
    this.formError.set(undefined);
    if (this.mutation() !== 'idle') {
      return;
    }
    this.mutation.set('saving');

    if (value.organizationId === NEW_ORGANIZATION_VALUE) {
      const newOrganization: CreateOrganizationDto = { name: value.newOrganizationName };
      this.organizationsApi.organizationsControllerCreate(newOrganization).subscribe({
        next: (organization) => this.submitRole(value, organization.id),
        error: (error: unknown) => this.handleMutationError(error),
      });
    } else {
      this.submitRole(value, value.organizationId);
    }
  }

  private submitRole(value: RoleFormValue, organizationId: string): void {
    const payload: CreateRoleDto = {
      jobTitle: value.jobTitle,
      organizationId,
      startDate: value.startDate,
      ...(value.descriptionEn ? { descriptionEn: value.descriptionEn } : {}),
      ...(value.descriptionNl ? { descriptionNl: value.descriptionNl } : {}),
      ...(value.location ? { location: value.location } : {}),
      ...(value.employmentType ? { employmentType: value.employmentType as CreateRoleDto.EmploymentTypeEnum } : {}),
      ...(value.endDate ? { endDate: value.endDate } : {}),
      skills: value.skills,
    };

    const role = this.selectedRole();
    const request = role
      ? this.rolesApi.rolesControllerUpdate(role.id, payload)
      : this.rolesApi.rolesControllerCreate(payload);
    request.subscribe({
      next: () => {
        this.mutation.set('idle');
        this.toast.success(role ? 'Role updated.' : 'Role created.');
        this.formOpen.set(false);
        this.selectedRole.set(undefined);
        this.roles.reload();
        this.organizations.reload();
      },
      error: (error: unknown) => this.handleMutationError(error),
    });
  }

  protected updateOrganization(update: OrganizationUpdate): void {
    const payload: UpdateOrganizationDto = {
      ...(update.logoUrl ? { logoUrl: update.logoUrl } : {}),
      ...(update.logoObjectKey ? { logoObjectKey: update.logoObjectKey } : {}),
      ...(update.website ? { website: update.website } : {}),
    };
    this.organizationsApi.organizationsControllerUpdate(update.id, payload).subscribe({
      next: () => {
        this.toast.success('Organization updated.');
        this.roles.reload();
        this.organizations.reload();
      },
      error: (error: unknown) => this.toast.error(this.mutationError(error)),
    });
  }

  protected askToDelete(role: RoleDto): void {
    this.pendingDelete.set(role);
  }

  protected cancelDelete(): void {
    if (!this.isDeleting()) {
      this.pendingDelete.set(undefined);
    }
  }

  protected deleteRole(): void {
    const role = this.pendingDelete();
    if (!role || this.mutation() !== 'idle') {
      return;
    }
    this.mutation.set('deleting');
    this.rolesApi.rolesControllerRemove(role.id).subscribe({
      next: () => {
        this.mutation.set('idle');
        this.pendingDelete.set(undefined);
        this.toast.success('Role deleted.');
        this.roles.reload();
      },
      error: (error: unknown) => {
        this.mutation.set('idle');
        this.pendingDelete.set(undefined);
        this.toast.error(this.mutationError(error));
      },
    });
  }

  protected retry(): void {
    this.roles.reload();
    this.organizations.reload();
  }

  private handleMutationError(error: unknown): void {
    this.mutation.set('idle');
    const message = this.mutationError(error);
    this.formError.set(message);
    this.toast.error(message);
  }

  private mutationError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return 'That organization name is already in use. Choose a unique name.';
    }
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return 'Your session has expired. Sign in again to manage your professional journey.';
    }
    return 'The request failed. Check the form and try again.';
  }
}
