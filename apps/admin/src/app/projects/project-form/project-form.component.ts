import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateProjectImageUploadUrlDto, ProjectDto, ProjectsService } from '@portfolio-ebeerens/api-client';
import {
  Button,
  Card,
  FileDropzone,
  FormLanguage,
  LanguageTabs,
  TagCombobox,
  TextInput,
  Textarea,
  ToastService,
} from '@portfolio-ebeerens/ui';
import { MarkdownComponent } from 'ngx-markdown';
import { firstValueFrom } from 'rxjs';

const PROJECT_IMAGE_MIME_TYPES: readonly string[] = Object.values(CreateProjectImageUploadUrlDto.MimeTypeEnum);
const PROJECT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export interface ProjectFormValue {
  title: string;
  slug: string;
  shortDescriptionEn: string;
  shortDescriptionNl: string;
  descriptionEn: string;
  descriptionNl: string;
  imageUrl: string;
  imageObjectKey: string;
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
  imports: [
    Button,
    Card,
    FileDropzone,
    LanguageTabs,
    MarkdownComponent,
    ReactiveFormsModule,
    TagCombobox,
    TextInput,
    Textarea,
  ],
  templateUrl: './project-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(ProjectsService);
  private readonly toast = inject(ToastService);

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
  protected readonly shortDescriptionLanguage = signal<FormLanguage>('en');
  protected readonly descriptionLanguage = signal<FormLanguage>('en');
  // Not a form control: the client only ever learns a *new* object key from a fresh upload
  // (ProjectDto doesn't expose the existing one), so this stays empty until an upload succeeds.
  protected readonly imageObjectKey = signal('');
  protected readonly imageUploading = signal(false);
  protected readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    shortDescriptionEn: ['', [Validators.required, Validators.maxLength(255)]],
    shortDescriptionNl: ['', Validators.maxLength(255)],
    descriptionEn: ['', Validators.required],
    descriptionNl: [''],
    imageUrl: ['', Validators.pattern(/^https?:\/\/.+/)],
    client: ['', Validators.maxLength(200)],
    jobRole: ['', Validators.maxLength(200)],
    liveUrl: ['', Validators.pattern(/^https?:\/\/.+/)],
    startDate: ['', Validators.required],
    endDate: [''],
    skills: this.formBuilder.nonNullable.control<string[]>([]),
  });

  protected readonly activeDescriptionControl = computed(() =>
    this.descriptionLanguage() === 'en' ? this.form.controls.descriptionEn : this.form.controls.descriptionNl
  );

  constructor() {
    effect(() => {
      this.project();
      this.resetToken();
      this.resetForm();
    });
  }

  protected async uploadImage(file: File): Promise<void> {
    if (this.imageUploading()) {
      return;
    }
    if (!PROJECT_IMAGE_MIME_TYPES.includes(file.type)) {
      this.toast.error('Only PNG, JPEG, or WebP images are supported.');
      return;
    }
    if (file.size > PROJECT_IMAGE_MAX_BYTES) {
      this.toast.error('The image must be 5MB or smaller.');
      return;
    }

    this.imageUploading.set(true);
    try {
      const { uploadUrl, objectKey, publicUrl } = await firstValueFrom(
        this.api.projectsControllerCreateImageUploadUrl({
          fileName: file.name,
          mimeType: file.type as CreateProjectImageUploadUrlDto.MimeTypeEnum,
          fileSize: file.size,
        })
      );
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      this.form.controls.imageUrl.setValue(publicUrl);
      this.imageObjectKey.set(objectKey);
      this.toast.success('Image uploaded.');
    } catch {
      this.toast.error('The image could not be uploaded. Try again.');
    } finally {
      this.imageUploading.set(false);
    }
  }

  protected removeImage(): void {
    this.form.controls.imageUrl.setValue('');
    this.imageObjectKey.set('');
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit({ ...this.form.getRawValue(), imageObjectKey: this.imageObjectKey() });
  }

  protected fieldInvalid(name: string): boolean {
    const control = this.form.get(name);
    return control !== null && control.invalid && control.touched;
  }

  private resetForm(): void {
    this.descriptionView.set('markdown');
    this.shortDescriptionLanguage.set('en');
    this.descriptionLanguage.set('en');
    this.imageObjectKey.set('');
    const project = this.project();
    this.form.reset(
      project
        ? {
            title: project.title,
            slug: project.slug,
            shortDescriptionEn: project.shortDescriptionEn,
            shortDescriptionNl: project.shortDescriptionNl ?? '',
            descriptionEn: project.descriptionEn,
            descriptionNl: project.descriptionNl ?? '',
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
            shortDescriptionEn: '',
            shortDescriptionNl: '',
            descriptionEn: '',
            descriptionNl: '',
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
