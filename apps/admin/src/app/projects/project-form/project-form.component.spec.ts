import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProjectDto } from '@portfolio-ebeerens/api-client';
import { provideMarkdown } from 'ngx-markdown';
import { ProjectForm, ProjectFormValue } from './project-form.component';

const project: ProjectDto = {
  id: 'project-1',
  title: 'Portfolio site',
  slug: 'portfolio-site',
  shortDescription: 'A concise portfolio project summary.',
  description: '## Overview',
  startDate: '2024-01-15',
  skills: [{ id: 'skill-1', name: 'Angular' }],
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

@Component({
  imports: [ProjectForm],
  template: `
    <admin-project-form
      [project]="project"
      [skillOptions]="skillOptions"
      [saving]="saving"
      [formError]="formError"
      [resetToken]="resetToken"
      (saved)="savedValue = $event"
      (cancelled)="cancelledCount = cancelledCount + 1"
    />
  `,
})
class HostComponent {
  project: ProjectDto | undefined;
  skillOptions: string[] = ['Angular', 'NestJS'];
  saving = false;
  formError: string | undefined;
  resetToken = 0;
  savedValue: ProjectFormValue | undefined;
  cancelledCount = 0;
}

function findButton(root: HTMLElement, text: string): HTMLButtonElement {
  return Array.from(root.querySelectorAll('button')).find(
    (button) => (button as HTMLButtonElement).textContent?.trim() === text
  ) as HTMLButtonElement;
}

describe('ProjectForm', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideMarkdown()],
    }).compileComponents();
  });

  it('shows "New project" heading in create mode', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('New project');
  });

  it('shows "Edit project" heading and populates fields when editing', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.project = project;
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Edit project');
    const titleInput = fixture.nativeElement.querySelector('#project-title') as HTMLInputElement;
    expect(titleInput.value).toBe('Portfolio site');
  });

  it('does not emit saved and shows a validation error for an invalid form', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    findButton(fixture.nativeElement, 'Save project').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.savedValue).toBeUndefined();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Enter a title.');
  });

  it('emits saved with the form value when valid', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const setValue = (id: string, value: string) => {
      const input = fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement | HTMLTextAreaElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    setValue('project-title', 'New project');
    setValue('project-slug', 'new-project');
    setValue('project-short-description', 'A short description.');
    setValue('project-description', 'Full description.');
    setValue('project-start-date', '2024-05-01');
    fixture.detectChanges();
    await fixture.whenStable();

    findButton(fixture.nativeElement, 'Save project').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.savedValue).toMatchObject({
      title: 'New project',
      slug: 'new-project',
      shortDescription: 'A short description.',
      description: 'Full description.',
      startDate: '2024-05-01',
    });
  });

  it('emits cancelled when Cancel is clicked', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    findButton(fixture.nativeElement, 'Cancel').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.cancelledCount).toBe(1);
  });

  it('resets to a blank form when resetToken changes in create mode', async () => {
    const fixture = TestBed.createComponent(ProjectForm);
    await fixture.whenStable();

    const titleInput = fixture.nativeElement.querySelector('#project-title') as HTMLInputElement;
    titleInput.value = 'Draft title';
    titleInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    // Plain @Input mutations on a host aren't picked up post-render in this zoneless app;
    // setInput() is the supported way to simulate a later input change in a test.
    fixture.componentRef.setInput('resetToken', 1);
    await fixture.whenStable();

    expect((fixture.nativeElement.querySelector('#project-title') as HTMLInputElement).value).toBe('');
  });
});
