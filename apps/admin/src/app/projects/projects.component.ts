import { HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { CreateProjectDto, ProjectDto, ProjectsService, SkillsService } from '@portfolio-ebeerens/api-client';
import { PageHeader, ToastService } from '@portfolio-ebeerens/ui';
import { map } from 'rxjs';
import { ProjectDeleteDialog } from './project-delete-dialog/project-delete-dialog.component';
import { ProjectForm, ProjectFormValue } from './project-form/project-form.component';
import { ProjectList } from './project-list/project-list.component';

type Mutation = 'idle' | 'saving' | 'deleting';

@Component({
  selector: 'admin-projects',
  imports: [PageHeader, ProjectDeleteDialog, ProjectForm, ProjectList],
  templateUrl: './projects.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-1 flex-col gap-8' },
})
export class Projects {
  private readonly api = inject(ProjectsService);
  private readonly skillsApi = inject(SkillsService);
  private readonly toast = inject(ToastService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly skillOptions = toSignal(
    this.skillsApi.skillsControllerFindAll().pipe(map((skills) => skills.map((skill) => skill.name))),
    { initialValue: [] as string[] }
  );

  protected readonly projects = rxResource({
    params: () => (this.isBrowser ? true : undefined),
    stream: () => this.api.projectsControllerFindAll(),
  });
  protected readonly projectList = computed(() => (this.projects.hasValue() ? this.projects.value() : undefined));
  protected readonly formOpen = signal(false);
  protected readonly selectedProject = signal<ProjectDto | undefined>(undefined);
  protected readonly pendingDelete = signal<ProjectDto | undefined>(undefined);
  protected readonly mutation = signal<Mutation>('idle');
  protected readonly formError = signal<string | undefined>(undefined);
  // Bumped on every begin-create/begin-edit so `ProjectForm` always resets, even create -> create.
  protected readonly formResetToken = signal(0);

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
    this.formError.set(undefined);
    this.formResetToken.update((token) => token + 1);
  }

  protected beginEdit(project: ProjectDto): void {
    this.formOpen.set(true);
    this.selectedProject.set(project);
    this.formError.set(undefined);
    this.formResetToken.update((token) => token + 1);
  }

  protected cancelEdit(): void {
    this.formOpen.set(false);
    this.selectedProject.set(undefined);
    this.formError.set(undefined);
  }

  protected save(value: ProjectFormValue): void {
    this.formError.set(undefined);
    if (this.mutation() !== 'idle') {
      return;
    }

    const payload: CreateProjectDto = {
      title: value.title,
      slug: value.slug,
      shortDescriptionEn: value.shortDescriptionEn,
      descriptionEn: value.descriptionEn,
      ...(value.shortDescriptionNl ? { shortDescriptionNl: value.shortDescriptionNl } : {}),
      ...(value.descriptionNl ? { descriptionNl: value.descriptionNl } : {}),
      startDate: value.startDate,
      ...(value.imageUrl ? { imageUrl: value.imageUrl } : {}),
      ...(value.imageObjectKey ? { imageObjectKey: value.imageObjectKey } : {}),
      ...(value.client ? { client: value.client } : {}),
      ...(value.jobRole ? { jobRole: value.jobRole } : {}),
      ...(value.liveUrl ? { liveUrl: value.liveUrl } : {}),
      ...(value.endDate ? { endDate: value.endDate } : {}),
      skills: value.skills,
    };

    this.mutation.set('saving');
    const project = this.selectedProject();
    const request = project
      ? this.api.projectsControllerUpdate(project.id, payload)
      : this.api.projectsControllerCreate(payload);
    request.subscribe({
      next: () => {
        this.mutation.set('idle');
        this.toast.success(project ? 'Project updated.' : 'Project created.');
        this.formOpen.set(false);
        this.selectedProject.set(undefined);
        this.projects.reload();
      },
      error: (error: unknown) => {
        this.mutation.set('idle');
        const message = this.mutationError(error);
        this.formError.set(message);
        this.toast.error(message);
      },
    });
  }

  protected askToDelete(project: ProjectDto): void {
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
        this.toast.success('Project deleted.');
        this.projects.reload();
      },
      error: (error: unknown) => {
        this.mutation.set('idle');
        this.pendingDelete.set(undefined);
        this.toast.error(this.mutationError(error));
      },
    });
  }

  protected retry(): void {
    this.projects.reload();
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
