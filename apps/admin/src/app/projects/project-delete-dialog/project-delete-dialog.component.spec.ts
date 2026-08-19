import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProjectDto } from '@portfolio-ebeerens/api-client';
import { ProjectDeleteDialog } from './project-delete-dialog.component';

const project: ProjectDto = {
  id: 'project-1',
  title: 'Portfolio site',
  slug: 'portfolio-site',
  shortDescription: 'A concise portfolio project summary.',
  description: '## Overview',
  startDate: '2024-01-15',
  skills: [],
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

@Component({
  imports: [ProjectDeleteDialog],
  template: `
    <admin-project-delete-dialog
      [project]="project"
      [deleting]="deleting"
      (confirm)="confirmed = true"
      (dismiss)="dismissed = true"
    />
  `,
})
class HostComponent {
  project: ProjectDto | undefined;
  deleting = false;
  confirmed = false;
  dismissed = false;
}

describe('ProjectDeleteDialog', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('renders nothing when there is no pending project', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders the project title when a project is pending', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.project = project;
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Delete Portfolio site?');
  });

  it('emits dismiss on Cancel and on Escape', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.project = project;
    await fixture.whenStable();

    const cancelButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'Cancel'
    ) as HTMLButtonElement;
    cancelButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.dismissed).toBe(true);
  });

  it('disables the Delete button while deleting', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.project = project;
    fixture.componentInstance.deleting = true;
    await fixture.whenStable();

    const deleteButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.trim().startsWith('Delet')
    ) as HTMLButtonElement;
    expect(deleteButton.disabled).toBe(true);
  });

  it('emits confirm on Delete when not deleting', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.project = project;
    await fixture.whenStable();

    const deleteButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.trim().startsWith('Delet')
    ) as HTMLButtonElement;
    deleteButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.confirmed).toBe(true);
  });
});
