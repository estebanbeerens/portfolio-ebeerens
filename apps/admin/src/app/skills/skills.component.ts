import { HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { SkillsService } from '@portfolio-ebeerens/api-client';
import { PageHeader, ToastService } from '@portfolio-ebeerens/ui';
import type { SkillDto, SkillManagementDto } from '@portfolio-ebeerens/api-client';
import type { Observable } from 'rxjs';
import { SkillBoard, type SkillMove } from './skill-board/skill-board.component';

type Mutation = 'idle' | 'saving';

function sortSkills(skills: SkillDto[]): SkillDto[] {
  return [...skills].sort((first, second) => first.name.localeCompare(second.name));
}

function sortCategories(data: SkillManagementDto): SkillManagementDto {
  return {
    ...data,
    categories: [...data.categories].sort((first, second) => first.name.localeCompare(second.name)),
  };
}

@Component({
  selector: 'admin-skills',
  imports: [PageHeader, SkillBoard],
  templateUrl: './skills.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-1 flex-col gap-8' },
})
export class Skills {
  private readonly api = inject(SkillsService);
  private readonly toast = inject(ToastService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly management = rxResource({
    params: () => (this.isBrowser ? true : undefined),
    stream: () => this.api.skillsControllerFindManagement(),
  });
  protected readonly data = computed(() => (this.management.hasValue() ? this.management.value() : undefined));
  protected readonly mutation = signal<Mutation>('idle');
  protected readonly mutationError = signal<string | undefined>(undefined);
  protected readonly status = signal('');
  protected readonly loadError = computed(() => {
    const error = this.management.error();
    return error instanceof HttpErrorResponse && error.status === 401
      ? 'Your session has expired. Sign in again to manage skills.'
      : error
        ? 'Skills could not be loaded. Try again.'
        : undefined;
  });

  protected retry(): void {
    this.management.reload();
  }

  protected createCategory(name: string): void {
    this.mutate(this.api.skillsControllerCreateCategory({ name }), `Created the "${name}" category.`, (category) =>
      this.management.update((data) =>
        data ? sortCategories({ ...data, categories: [...data.categories, category] }) : data
      )
    );
  }

  protected updateCategory(change: { id: string; name: string }): void {
    this.mutate(
      this.api.skillsControllerUpdateCategory(change.id, { name: change.name }),
      `Renamed the category to "${change.name}".`,
      (updatedCategory) =>
        this.management.update((data) =>
          data
            ? sortCategories({
                ...data,
                categories: data.categories.map((category) =>
                  category.id === updatedCategory.id ? updatedCategory : category
                ),
              })
            : data
        )
    );
  }

  protected deleteCategory(id: string): void {
    const category = this.data()?.categories.find((item) => item.id === id);
    this.mutate(
      this.api.skillsControllerRemoveCategory(id),
      `Deleted "${category?.name ?? 'category'}"; its skills are now unassigned.`,
      () =>
        this.management.update((data) =>
          data && category
            ? {
                ...data,
                categories: data.categories.filter((item) => item.id !== id),
                unassignedSkills: sortSkills([...data.unassignedSkills, ...category.skills]),
              }
            : data
        )
    );
  }

  protected moveSkill(move: SkillMove): void {
    const skill =
      this.data()?.unassignedSkills.find((item) => item.id === move.skillId) ??
      this.data()
        ?.categories.flatMap((category) => category.skills)
        .find((item) => item.id === move.skillId);
    const category = move.categoryId ? this.data()?.categories.find((item) => item.id === move.categoryId) : undefined;
    const destination = category?.name ?? 'unassigned skills';

    this.mutate(
      this.api.skillsControllerSetCategory(move.skillId, { categoryId: move.categoryId }),
      `Moved "${skill?.name ?? 'skill'}" to ${destination}.`,
      (updatedSkill) =>
        this.management.update((data) =>
          data
            ? {
                ...data,
                categories: data.categories.map((item) => {
                  const skills = item.skills.filter((existing) => existing.id !== updatedSkill.id);
                  return item.id === move.categoryId
                    ? { ...item, skills: sortSkills([...skills, updatedSkill]) }
                    : {
                        ...item,
                        skills,
                      };
                }),
                unassignedSkills:
                  move.categoryId === null
                    ? sortSkills([...data.unassignedSkills.filter((item) => item.id !== updatedSkill.id), updatedSkill])
                    : data.unassignedSkills.filter((item) => item.id !== updatedSkill.id),
              }
            : data
        )
    );
  }

  private mutate<T>(request: Observable<T>, successMessage: string, onSuccess: (result: T) => void): void {
    if (this.mutation() !== 'idle') return;

    this.mutation.set('saving');
    this.mutationError.set(undefined);
    this.status.set('Saving skill changes.');
    request.subscribe({
      next: (result) => {
        this.mutation.set('idle');
        this.status.set(successMessage);
        onSuccess(result);
        this.toast.success(successMessage);
      },
      error: (error: unknown) => {
        this.mutation.set('idle');
        const message = this.mutationErrorMessage(error);
        this.mutationError.set(message);
        this.status.set('');
        this.toast.error(message);
      },
    });
  }

  private mutationErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return 'Your session has expired. Sign in again to manage skills.';
    }
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return 'A category with that name already exists. Choose a different name.';
    }
    if (error instanceof HttpErrorResponse && error.status === 404) {
      return 'The category or skill no longer exists. Reload the list and try again.';
    }
    return 'The skill changes could not be saved. Try again.';
  }
}
