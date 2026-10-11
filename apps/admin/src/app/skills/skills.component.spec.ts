import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { SkillManagementDto, SkillsService } from '@portfolio-ebeerens/api-client';
import { ToastService } from '@portfolio-ebeerens/ui';
import { of, throwError } from 'rxjs';
import { Skills } from './skills.component';

const skillManagement: SkillManagementDto = {
  categories: [
    {
      id: 'category-1',
      name: 'Frontend',
      skills: [{ id: 'skill-1', name: 'Angular' }],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'category-2',
      name: 'Backend',
      skills: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  unassignedSkills: [{ id: 'skill-2', name: 'TypeScript' }],
};

describe('Skills', () => {
  const toast = { success: vi.fn(), error: vi.fn() };

  function configure(api: Partial<SkillsService>) {
    toast.success.mockClear();
    toast.error.mockClear();
    TestBed.configureTestingModule({
      imports: [Skills],
      providers: [
        { provide: SkillsService, useValue: api },
        { provide: ToastService, useValue: toast },
      ],
    });
  }

  it('renders existing skills in category and unassigned sections', async () => {
    const load = vi.fn(() => of(skillManagement));
    configure({ skillsControllerFindManagement: load as never });

    const fixture = TestBed.createComponent(Skills);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Skill Categories');
    expect(element.textContent).toContain('Unassigned skills');
    expect(element.textContent).toContain('Angular');
    expect(element.textContent).toContain('TypeScript');
    expect(load).toHaveBeenCalledOnce();
  });

  it('creates a trimmed category and reloads the management data', async () => {
    const create = vi.fn(() =>
      of({
        id: 'category-3',
        name: 'Cloud',
        skills: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })
    );
    const load = vi.fn(() => of(skillManagement));
    configure({
      skillsControllerFindManagement: load as never,
      skillsControllerCreateCategory: create as never,
    });

    const fixture = TestBed.createComponent(Skills);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const createButton = Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Create new category')
    ) as HTMLButtonElement;
    createButton.click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#new-skill-category-name') as HTMLInputElement;
    input.value = '  Cloud  ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.closest('form')?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    expect(create).toHaveBeenCalledWith({ name: 'Cloud' });
    expect(load).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith('Created the "Cloud" category.');
    fixture.destroy();
  });

  it('renames a category and reloads the management data', async () => {
    const update = vi.fn(() =>
      of({
        ...skillManagement.categories[0],
        name: 'Platform',
      })
    );
    configure({
      skillsControllerFindManagement: vi.fn(() => of(skillManagement)) as never,
      skillsControllerUpdateCategory: update as never,
    });

    const fixture = TestBed.createComponent(Skills);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    (element.querySelector('button[aria-label="Rename Frontend"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const input = element.querySelector('#skill-category-category-1') as HTMLInputElement;
    input.value = 'Platform';
    input.closest('form')?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    expect(update).toHaveBeenCalledWith('category-1', { name: 'Platform' });
    fixture.destroy();
  });

  it('deletes a category after explicit confirmation', async () => {
    const remove = vi.fn(() => of(undefined));
    configure({
      skillsControllerFindManagement: vi.fn(() => of(skillManagement)) as never,
      skillsControllerRemoveCategory: remove as never,
    });

    const fixture = TestBed.createComponent(Skills);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    (element.querySelector('button[aria-label="Delete Frontend"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const confirm = Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Confirm delete')
    ) as HTMLButtonElement;
    confirm.click();
    await fixture.whenStable();

    expect(remove).toHaveBeenCalledWith('category-1');
    expect(toast.success).toHaveBeenCalledWith('Deleted "Frontend"; its skills are now unassigned.');
    fixture.destroy();
  });

  it('moves a skill with the accessible select control and preserves its location on failure', async () => {
    const move = vi.fn(() => throwError(() => new HttpErrorResponse({ status: 404 })));
    configure({
      skillsControllerFindManagement: vi.fn(() => of(skillManagement)) as never,
      skillsControllerSetCategory: move as never,
    });

    const fixture = TestBed.createComponent(Skills);
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('#move-skill-skill-1') as HTMLSelectElement;
    select.value = '';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();

    expect(move).toHaveBeenCalledWith('skill-1', { categoryId: null });
    expect(select.value).toBe('category-1');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('The category or skill no longer exists');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Angular');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    fixture.destroy();
  });

  it('shows a session-expired message when category data cannot be loaded', async () => {
    configure({
      skillsControllerFindManagement: vi.fn(() => throwError(() => new HttpErrorResponse({ status: 401 }))) as never,
    });

    const fixture = TestBed.createComponent(Skills);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Your session has expired');
    fixture.destroy();
  });
});
