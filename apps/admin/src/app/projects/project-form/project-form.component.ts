import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectDto } from '@portfolio-ebeerens/api-client';
import { Button, Card, TagCombobox, TextInput, Textarea } from '@portfolio-ebeerens/ui';
import { MarkdownComponent } from 'ngx-markdown';

export interface ProjectFormValue {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  client: string;
  jobRole: string;
  liveUrl: string;
  startDate: string;
  endDate: string;
  skills: string[];
}

/**
 * Presentational create/edit form for a project; the container owns API calls and payload mapping.
 */
@Component({
  selector: 'admin-project-form',
  imports: [Button, Card, MarkdownComponent, ReactiveFormsModule, TagCombobox, TextInput, Textarea],
  templateUrl: './project-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectForm {
  private readonly formBuilder = inject(FormBuilder);

  readonly project = input<ProjectDto>();
  readonly skillOptions = input<string[]>([]);
  readonly saving = input(false);
  readonly formError = input<string>();
  // Bumped by the container on every begin-create/begin-edit so the form resets even when
  // `project()` doesn't change by value (e.g. create -> create, or edit -> same project again).
  readonly resetToken = input(0);

  readonly saved = output<ProjectFormValue>();
  readonly cancelled = output<void>();

  protected readonly isEditing = computed(() => this.project() !== undefined);
  protected readonly descriptionView = signal<'markdown' | 'preview'>('markdown');
  protected readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    shortDescription: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', Validators.required],
    imageUrl: ['', Validators.pattern(/^https?:\/\/.+/)],
    client: ['', Validators.maxLength(200)],
    jobRole: ['', Validators.maxLength(200)],
    liveUrl: ['', Validators.pattern(/^https?:\/\/.+/)],
    startDate: ['', Validators.required],
    endDate: [''],
    skills: this.formBuilder.nonNullable.control<string[]>([]),
  });

  constructor() {
    effect(() => {
      this.project();
      this.resetToken();
      this.resetForm();
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
    const project = this.project();
    this.form.reset(
      project
        ? {
            title: project.title,
            slug: project.slug,
            shortDescription: project.shortDescription,
            description: project.description,
            imageUrl: project.imageUrl ?? '',
            client: project.client ?? '',
            jobRole: project.jobRole ?? '',
            liveUrl: project.liveUrl ?? '',
            startDate: project.startDate.slice(0, 10),
            endDate: project.endDate?.slice(0, 10) ?? '',
            skills: project.skills.map((skill) => skill.name),
          }
        : {
            title: '',
            slug: '',
            shortDescription: '',
            description: '',
            imageUrl: '',
            client: '',
            jobRole: '',
            liveUrl: '',
            startDate: '',
            endDate: '',
            skills: [],
          }
    );
  }
}
