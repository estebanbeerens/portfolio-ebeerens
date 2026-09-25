import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EducationDto, InstitutionDto } from '@portfolio-ebeerens/api-client';
import { Button, Card, LanguageTabs, Markdown, Select, SelectOption, TextInput } from '@portfolio-ebeerens/ui';

export const NEW_INSTITUTION_VALUE = '__new__';
export interface EducationFormValue {
  degree: string;
  fieldOfStudy: string;
  institutionId: string;
  newInstitutionName: string;
  descriptionEn: string;
  descriptionNl: string;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'admin-education-form',
  imports: [Button, Card, LanguageTabs, Markdown, ReactiveFormsModule, Select, TextInput],
  templateUrl: './education-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationForm {
  private readonly fb = inject(FormBuilder);
  readonly education = input<EducationDto>();
  readonly institutions = input<InstitutionDto[]>([]);
  readonly saving = input(false);
  readonly formError = input<string>();
  readonly resetToken = input(0);
  readonly saved = output<EducationFormValue>();
  readonly cancelled = output<void>();
  protected readonly newInstitutionValue = NEW_INSTITUTION_VALUE;
  protected readonly isEditing = computed(() => this.education() !== undefined);
  protected readonly descriptionLanguage = signal<'en' | 'nl'>('en');
  protected readonly descriptionView = signal<'markdown' | 'preview'>('markdown');
  protected readonly institutionOptions = computed<SelectOption[]>(() => [
    ...this.institutions().map((i) => ({ value: i.id, label: i.name })),
    { value: NEW_INSTITUTION_VALUE, label: '+ New institution' },
  ]);
  protected readonly form = this.fb.nonNullable.group({
    degree: ['', [Validators.required, Validators.maxLength(200)]],
    fieldOfStudy: ['', Validators.maxLength(200)],
    institutionId: ['', Validators.required],
    newInstitutionName: [''],
    descriptionEn: [''],
    descriptionNl: [''],
    startDate: ['', Validators.required],
    endDate: [''],
  });
  protected readonly activeDescriptionControl = computed(() =>
    this.descriptionLanguage() === 'en' ? this.form.controls.descriptionEn : this.form.controls.descriptionNl
  );
  private readonly institutionIdValue = toSignal(this.form.controls.institutionId.valueChanges, { initialValue: '' });
  protected readonly showNewInstitutionField = computed(() => this.institutionIdValue() === NEW_INSTITUTION_VALUE);

  constructor() {
    effect(() => {
      this.education();
      this.resetToken();
      this.resetForm();
    });
    effect(() => {
      const control = this.form.controls.newInstitutionName;
      control.setValidators(
        this.showNewInstitutionField() ? [Validators.required, Validators.maxLength(200)] : [Validators.maxLength(200)]
      );
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
    const education = this.education();
    this.descriptionLanguage.set('en');
    this.descriptionView.set('markdown');
    this.form.reset(
      education
        ? {
            degree: education.degree,
            fieldOfStudy: education.fieldOfStudy ?? '',
            institutionId: education.institution.id,
            newInstitutionName: '',
            descriptionEn: education.descriptionEn ?? '',
            descriptionNl: education.descriptionNl ?? '',
            startDate: education.startDate.slice(0, 10),
            endDate: education.endDate?.slice(0, 10) ?? '',
          }
        : {
            degree: '',
            fieldOfStudy: '',
            institutionId: '',
            newInstitutionName: '',
            descriptionEn: '',
            descriptionNl: '',
            startDate: '',
            endDate: '',
          }
    );
  }
}
