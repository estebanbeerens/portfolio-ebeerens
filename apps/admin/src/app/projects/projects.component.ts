import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateProjectDto, ProjectDto, ProjectsService } from '@portfolio-ebeerens/api-client';
import { Card, PageHeader } from '@portfolio-ebeerens/ui';

type Mutation = 'idle' | 'saving' | 'deleting';

@Component({
  selector: 'admin-projects',
  imports: [Card, DatePipe, PageHeader, ReactiveFormsModule],
  templateUrl: './projects.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-1 flex-col gap-8' },
})
export class Projects {
  private readonly api = inject(ProjectsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly projects = rxResource({
    params: () => (this.isBrowser ? true : undefined),
    stream: () => this.api.projectsControllerFindAll(),
  });
  protected readonly projectList = computed(() => (this.projects.hasValue() ? this.projects.value() : undefined));
  protected readonly formOpen = signal(false);
  protected readonly selectedProject = signal<ProjectDto | undefined>(undefined);
  protected readonly pendingDelete = signal<ProjectDto | undefined>(undefined);
  protected readonly mutation = signal<Mutation>('idle');
  protected readonly feedback = signal<string | undefined>(undefined);
  protected readonly formError = signal<string | undefined>(undefined);
  protected readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    description: ['{"type":"doc","content":[]}', Validators.required],
    imageUrl: ['', Validators.pattern(/^https?:\/\/.+/)],
    client: ['', Validators.maxLength(200)],
    jobRole: ['', Validators.maxLength(200)],
    liveUrl: ['', Validators.pattern(/^https?:\/\/.+/)],
    startDate: ['', Validators.required],
    endDate: [''],
    skills: [''],
  });

  protected readonly isEditing = computed(() => this.selectedProject() !== undefined);
  protected readonly isSaving = computed(() => this.mutation() === 'saving');
  protected readonly isDeleting = computed(() => this.mutation() === 'deleting');
  protected readonly requestError = computed(() => {
    const error = this.projects.error();
    return error instanceof HttpErrorResponse && error.status === 401
      ? 'Your session has expired. Sign in again to manage projects.'
      : error
        ? 'Projects could not be loaded. Try again.'
        : undefined;
  });

  protected beginCreate(): void {
    this.formOpen.set(true);
    this.selectedProject.set(undefined);
    this.feedback.set(undefined);
    this.formError.set(undefined);
    this.form.reset({
      title: '',
      slug: '',
      description: '{"type":"doc","content":[]}',
      imageUrl: '',
      client: '',
      jobRole: '',
      liveUrl: '',
      startDate: '',
      endDate: '',
      skills: '',
    });
  }

  protected beginEdit(project: ProjectDto): void {
    this.formOpen.set(true);
    this.selectedProject.set(project);
    this.feedback.set(undefined);
    this.formError.set(undefined);
    this.form.reset({
      title: project.title,
      slug: project.slug,
      description: JSON.stringify(project.description, null, 2),
      imageUrl: project.imageUrl ?? '',
      client: project.client ?? '',
      jobRole: project.jobRole ?? '',
      liveUrl: project.liveUrl ?? '',
      startDate: project.startDate.slice(0, 10),
      endDate: project.endDate?.slice(0, 10) ?? '',
      skills: project.skills.map((skill) => skill.name).join(', '),
    });
  }

  protected cancelEdit(): void {
    this.formOpen.set(false);
    this.selectedProject.set(undefined);
    this.formError.set(undefined);
  }

  protected save(): void {
    this.feedback.set(undefined);
    this.formError.set(undefined);
    if (this.form.invalid || this.mutation() !== 'idle') {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    let description: object;
    try {
      description = JSON.parse(value.description) as object;
    } catch {
      this.formError.set('Description must be valid JSON.');
      return;
    }

    const payload: CreateProjectDto = {
      title: value.title,
      slug: value.slug,
      description,
      startDate: value.startDate,
      ...(value.imageUrl ? { imageUrl: value.imageUrl } : {}),
      ...(value.client ? { client: value.client } : {}),
      ...(value.jobRole ? { jobRole: value.jobRole } : {}),
      ...(value.liveUrl ? { liveUrl: value.liveUrl } : {}),
      ...(value.endDate ? { endDate: value.endDate } : {}),
      ...(value.skills
        ? {
            skills: value.skills
              .split(',')
              .map((skill) => skill.trim())
              .filter(Boolean),
          }
        : {}),
    };

    this.mutation.set('saving');
    const project = this.selectedProject();
    const request = project
      ? this.api.projectsControllerUpdate(project.id, payload)
      : this.api.projectsControllerCreate(payload);
    request.subscribe({
      next: () => {
        this.mutation.set('idle');
        this.feedback.set(project ? 'Project updated.' : 'Project created.');
        this.selectedProject.set(undefined);
        this.projects.reload();
      },
      error: (error: unknown) => {
        this.mutation.set('idle');
        this.formError.set(this.mutationError(error));
      },
    });
  }

  protected askToDelete(project: ProjectDto): void {
    this.feedback.set(undefined);
    this.pendingDelete.set(project);
  }

  protected cancelDelete(): void {
    if (!this.isDeleting()) {
      this.pendingDelete.set(undefined);
    }
  }

  protected deleteProject(): void {
    const project = this.pendingDelete();
    if (!project || this.mutation() !== 'idle') {
      return;
    }
    this.mutation.set('deleting');
    this.api.projectsControllerRemove(project.id).subscribe({
      next: () => {
        this.mutation.set('idle');
        this.pendingDelete.set(undefined);
        this.feedback.set('Project deleted.');
        this.projects.reload();
      },
      error: (error: unknown) => {
        this.mutation.set('idle');
        this.pendingDelete.set(undefined);
        this.feedback.set(this.mutationError(error));
      },
    });
  }

  protected retry(): void {
    this.projects.reload();
  }

  protected fieldInvalid(name: string): boolean {
    const control = this.form.get(name);
    return control !== null && control.invalid && control.touched;
  }

  private mutationError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return 'That slug is already in use. Choose a unique slug.';
    }
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return 'Your session has expired. Sign in again to manage projects.';
    }
    return 'The request failed. Check the form and try again.';
  }
}
