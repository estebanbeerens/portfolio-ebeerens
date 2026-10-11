import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  PLATFORM_ID,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import type { SkillCategoryDto, SkillDto, SkillManagementDto } from '@portfolio-ebeerens/api-client';
import { Button, Card } from '@portfolio-ebeerens/ui';

export interface SkillMove {
  skillId: string;
  categoryId: string | null;
}

interface DraggedSkill {
  skillId: string;
  categoryId: string | null;
}

@Component({
  selector: 'admin-skill-board',
  imports: [Button, Card],
  templateUrl: './skill-board.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
})
export class SkillBoard {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  readonly data = input<SkillManagementDto>();
  readonly loading = input(false);
  readonly loadError = input<string>();
  readonly busy = input(false);
  readonly mutationError = input<string>();
  readonly status = input('');

  readonly createCategory = output<string>();
  readonly updateCategory = output<{ id: string; name: string }>();
  readonly deleteCategory = output<string>();
  readonly moveSkill = output<SkillMove>();
  readonly retry = output<void>();

  protected readonly createFormOpen = signal(false);
  protected readonly editingCategoryId = signal<string | undefined>(undefined);
  protected readonly pendingDeleteId = signal<string | undefined>(undefined);
  protected readonly dropTargetId = signal<string | null | undefined>(undefined);
  protected readonly newCategoryName = signal('');
  protected readonly formError = signal<string | undefined>(undefined);
  private readonly draggedSkill = signal<DraggedSkill | undefined>(undefined);
  private readonly focusTarget = signal<string | undefined>(undefined);
  private readonly processedStatus = signal('');

  constructor() {
    effect(() => {
      const status = this.status();
      if (status !== this.processedStatus()) {
        this.processedStatus.set(status);
        if (status.startsWith('Created the "')) {
          this.newCategoryName.set('');
        }
        if (status.startsWith('Deleted "')) {
          this.pendingDeleteId.set(undefined);
          this.focusTarget.set('create-skill-category');
        }
      }

      const target = this.focusTarget();
      if (!this.isBrowser || !target) return;
      this.focusTarget.set(undefined);
      afterNextRender(() => this.document.getElementById(target)?.focus(), { injector: this.injector });
    });
  }

  protected openCreateForm(): void {
    this.createFormOpen.set(true);
    this.editingCategoryId.set(undefined);
    this.pendingDeleteId.set(undefined);
    this.formError.set(undefined);
    this.focusTarget.set('new-skill-category-name');
  }

  protected cancelCreateForm(): void {
    this.createFormOpen.set(false);
    this.focusTarget.set('create-skill-category');
  }

  protected submitCreate(event: SubmitEvent, name: string): void {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      this.formError.set('Enter a category name with at least one non-space character.');
      return;
    }
    if (this.busy()) return;
    this.formError.set(undefined);
    this.createCategory.emit(trimmedName);
  }

  protected submitRename(event: SubmitEvent, id: string, name: string): void {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      this.formError.set('Enter a category name with at least one non-space character.');
      return;
    }
    if (this.busy()) return;
    this.formError.set(undefined);
    this.updateCategory.emit({ id, name: trimmedName });
  }

  protected clearFormError(): void {
    this.formError.set(undefined);
  }

  protected setCategoryName(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.newCategoryName.set(target.value);
      this.formError.set(undefined);
    }
  }

  protected beginRename(categoryId: string): void {
    this.createFormOpen.set(false);
    this.editingCategoryId.set(categoryId);
    this.pendingDeleteId.set(undefined);
    this.formError.set(undefined);
    this.focusTarget.set(`skill-category-${categoryId}`);
  }

  protected cancelRename(categoryId: string): void {
    this.editingCategoryId.set(undefined);
    this.focusTarget.set(`rename-skill-category-${categoryId}`);
  }

  protected beginDelete(categoryId: string): void {
    this.createFormOpen.set(false);
    this.pendingDeleteId.set(categoryId);
    this.editingCategoryId.set(undefined);
    this.formError.set(undefined);
    this.focusTarget.set(`confirm-delete-skill-category-${categoryId}`);
  }

  protected cancelDelete(categoryId: string): void {
    this.pendingDeleteId.set(undefined);
    this.focusTarget.set(`delete-skill-category-${categoryId}`);
  }

  protected confirmDelete(categoryId: string): void {
    this.deleteCategory.emit(categoryId);
  }

  protected startDrag(event: DragEvent, skill: SkillDto, categoryId: string | null): void {
    if (this.busy()) {
      event.preventDefault();
      return;
    }
    this.draggedSkill.set({ skillId: skill.id, categoryId });
    this.dropTargetId.set(undefined);
    event.dataTransfer?.setData('text/plain', skill.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  protected allowDrop(event: DragEvent, categoryId: string | null): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dropTargetId.set(categoryId);
  }

  protected dropSkill(event: DragEvent, categoryId: string | null): void {
    event.preventDefault();
    const dragged = this.draggedSkill();
    const skillId = event.dataTransfer?.getData('text/plain') || dragged?.skillId;
    const sourceCategoryId = dragged?.categoryId;
    this.dropTargetId.set(undefined);
    this.draggedSkill.set(undefined);

    if (!skillId || sourceCategoryId === categoryId || this.busy()) return;
    this.moveSkill.emit({ skillId, categoryId });
  }

  protected endDrag(): void {
    this.draggedSkill.set(undefined);
    this.dropTargetId.set(undefined);
  }

  protected moveSkillTo(event: Event, skill: SkillDto, currentCategoryId: string | null): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement) || this.busy()) return;
    const categoryId = target.value || null;
    target.value = currentCategoryId ?? '';
    if (categoryId !== currentCategoryId) {
      this.moveSkill.emit({ skillId: skill.id, categoryId });
    }
  }

  protected categoryLabel(category: SkillCategoryDto): string {
    return `${category.name}, ${category.skills.length} ${category.skills.length === 1 ? 'skill' : 'skills'}`;
  }
}
