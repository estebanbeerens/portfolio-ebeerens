import { TestBed } from '@angular/core/testing';
import { SkillManagementDto } from '@portfolio-ebeerens/api-client';
import { axe } from 'vitest-axe';
import { SkillBoard } from './skill-board.component';

const management: SkillManagementDto = {
  categories: [
    {
      id: 'frontend',
      name: 'Frontend',
      skills: [{ id: 'angular', name: 'Angular' }],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'backend',
      name: 'Backend',
      skills: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  unassignedSkills: [{ id: 'typescript', name: 'TypeScript' }],
};

describe('SkillBoard', () => {
  async function createBoard() {
    const fixture = TestBed.createComponent(SkillBoard);
    fixture.componentRef.setInput('data', management);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('creates a category from the category section', async () => {
    const fixture = await createBoard();
    const create = vi.fn();
    fixture.componentInstance.createCategory.subscribe(create);

    const element = fixture.nativeElement as HTMLElement;
    const button = Array.from(element.querySelectorAll('button')).find((item) =>
      item.textContent?.includes('Create new category')
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('#new-skill-category-name') as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    input.value = '  Cloud  ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.closest('form')?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));

    expect(create).toHaveBeenCalledWith('Cloud');
    fixture.destroy();
  });

  it('offers a keyboard-operable move control for categorized skills', async () => {
    const fixture = await createBoard();
    const move = vi.fn();
    fixture.componentInstance.moveSkill.subscribe(move);

    const select = fixture.nativeElement.querySelector('#move-skill-angular') as HTMLSelectElement;
    select.value = 'backend';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(move).toHaveBeenCalledWith({ skillId: 'angular', categoryId: 'backend' });
    expect(select.value).toBe('frontend');
    fixture.destroy();
  });

  it('moves a dragged unassigned skill into a category', async () => {
    const fixture = await createBoard();
    const move = vi.fn();
    fixture.componentInstance.moveSkill.subscribe(move);
    const element = fixture.nativeElement as HTMLElement;
    const source = Array.from(element.querySelectorAll('li[draggable="true"]')).find((item) =>
      item.textContent?.includes('TypeScript')
    ) as HTMLElement;
    const target = element.querySelector('section[aria-label^="Backend"]') as HTMLElement;
    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      getData: vi.fn(() => 'typescript'),
      setData: vi.fn(),
    };

    const dragStart = new Event('dragstart', { bubbles: true }) as DragEvent;
    Object.defineProperty(dragStart, 'dataTransfer', { value: dataTransfer });
    source.dispatchEvent(dragStart);

    const dragOver = new Event('dragover', { bubbles: true, cancelable: true }) as DragEvent;
    Object.defineProperty(dragOver, 'dataTransfer', { value: dataTransfer });
    target.dispatchEvent(dragOver);

    const drop = new Event('drop', { bubbles: true, cancelable: true }) as DragEvent;
    Object.defineProperty(drop, 'dataTransfer', { value: dataTransfer });
    target.dispatchEvent(drop);

    expect(dragOver.defaultPrevented).toBe(true);
    expect(move).toHaveBeenCalledWith({ skillId: 'typescript', categoryId: 'backend' });
    fixture.destroy();
  });

  it('explains that deleting a category returns its skills to unassigned', async () => {
    const fixture = await createBoard();

    const deleteButton = fixture.nativeElement.querySelector(
      'button[aria-label="Delete Frontend"]'
    ) as HTMLButtonElement;
    deleteButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const confirmDelete = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Confirm delete')
    ) as HTMLButtonElement;
    expect(document.activeElement).toBe(confirmDelete);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Its skills will return to the unassigned list.'
    );
    fixture.destroy();
  });

  it('has no automated accessibility violations', async () => {
    const fixture = await createBoard();

    const results = await axe(fixture.nativeElement);

    expect(results.violations).toEqual([]);
    fixture.destroy();
  });
});
