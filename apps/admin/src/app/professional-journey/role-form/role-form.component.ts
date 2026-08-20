import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationDto, RoleDto } from '@portfolio-ebeerens/api-client';
import { Button, Card, Markdown, Select, SelectOption, TagCombobox, TextInput } from '@portfolio-ebeerens/ui';
import { EMPLOYMENT_TYPE_OPTIONS } from '../employment-type';

export const NEW_ORGANIZATION_VALUE = '__new__';

export interface RoleFormValue {
  jobTitle: string;
  organizationId: string;
  newOrganizationName: string;
  description: string;
  location: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  skills: string[];
}

/**
 * Presentational create/edit form for a role; the container owns API calls and payload mapping.
 */
@Component({
  selector: 'admin-role-form',
  imports: [Button, Card, Markdown, ReactiveFormsModule, Select, TagCombobox, TextInput],
  templateUrl: './role-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleForm {
  private readonly formBuilder = inject(FormBuilder);

  readonly role = input<RoleDto>();
  readonly organizations = input<OrganizationDto[]>([]);
  readonly skillOptions = input<string[]>([]);
  readonly saving = input(false);
  readonly formError = input<string>();
  // Bumped by the container on every begin-create/begin-edit so the form resets even when
  // `role()` doesn't change by value (e.g. create -> create, or edit -> same role again).
  readonly resetToken = input(0);

  readonly saved = output<RoleFormValue>();
  readonly cancelled = output<void>();

  protected readonly newOrganizationValue = NEW_ORGANIZATION_VALUE;
  protected readonly isEditing = computed(() => this.role() !== undefined);
  protected readonly descriptionView = signal<'markdown' | 'preview'>('markdown');
  protected readonly employmentTypeOptions = EMPLOYMENT_TYPE_OPTIONS;
  protected readonly organizationOptions = computed<SelectOption[]>(() => [
    ...this.organizations().map((organization) => ({ value: organization.id, label: organization.name })),
    { value: NEW_ORGANIZATION_VALUE, label: '+ New organization' },
  ]);

  protected readonly form = this.formBuilder.nonNullable.group({
    jobTitle: ['', [Validators.required, Validators.maxLength(200)]],
    organizationId: ['', Validators.required],
    newOrganizationName: [''],
    description: [''],
    location: ['', Validators.maxLength(200)],
    employmentType: [''],
    startDate: ['', Validators.required],
    endDate: [''],
    skills: this.formBuilder.nonNullable.control<string[]>([]),
  });

  private readonly organizationIdValue = toSignal(this.form.controls.organizationId.valueChanges, {
    initialValue: '',
  });
  protected readonly showNewOrganizationField = computed(() => this.organizationIdValue() === NEW_ORGANIZATION_VALUE);

  constructor() {
    effect(() => {
      this.role();
      this.resetToken();
      this.resetForm();
    });

    effect(() => {
      const isNew = this.showNewOrganizationField();
      const control = this.form.controls.newOrganizationName;
      control.setValidators(isNew ? [Validators.required, Validators.maxLength(200)] : [Validators.maxLength(200)]);
      control.updateValueAndValidity({ emitEvent: false });
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(this.form.getRawValue());
  }

  protected fieldInvalid(name: string): boolean {
    const control = this.form.get(name);
    return control !== null && control.invalid && control.touched;
  }

  private resetForm(): void {
    this.descriptionView.set('markdown');
    const role = this.role();
    this.form.reset(
      role
        ? {
            jobTitle: role.jobTitle,
            organizationId: role.organization.id,
            newOrganizationName: '',
            description: role.description ?? '',
            location: role.location ?? '',
            employmentType: role.employmentType ?? '',
            startDate: role.startDate.slice(0, 10),
            endDate: role.endDate?.slice(0, 10) ?? '',
            skills: role.skills.map((skill) => skill.name),
          }
        : {
            jobTitle: '',
            organizationId: '',
            newOrganizationName: '',
            description: '',
            location: '',
            employmentType: '',
            startDate: '',
            endDate: '',
            skills: [],
          }
    );
  }
}
