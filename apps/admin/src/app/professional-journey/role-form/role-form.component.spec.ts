import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OrganizationDto, RoleDto } from '@portfolio-ebeerens/api-client';
import { RoleForm, RoleFormValue } from './role-form.component';

const organization: OrganizationDto = {
  id: 'org-1',
  name: 'Acme Corp',
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

const role: RoleDto = {
  id: 'role-1',
  jobTitle: 'Engineer',
  organization,
  startDate: '2024-01-15',
  skills: [{ id: 'skill-1', name: 'Angular' }],
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

@Component({
  imports: [RoleForm],
  template: `
    <admin-role-form
      [role]="role"
      [organizations]="organizations"
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
  role: RoleDto | undefined;
  organizations: OrganizationDto[] = [organization];
  skillOptions: string[] = ['Angular', 'NestJS'];
  saving = false;
  formError: string | undefined;
  resetToken = 0;
  savedValue: RoleFormValue | undefined;
  cancelledCount = 0;
}

function findButton(root: HTMLElement, text: string): HTMLButtonElement {
  return Array.from(root.querySelectorAll('button')).find(
    (button) => (button as HTMLButtonElement).textContent?.trim() === text
  ) as HTMLButtonElement;
}

describe('RoleForm', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('shows "New role" heading in create mode', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('New role');
  });

  it('shows "Edit role" heading and populates fields when editing', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.role = role;
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Edit role');
    const jobTitleInput = fixture.nativeElement.querySelector('#role-job-title') as HTMLInputElement;
    expect(jobTitleInput.value).toBe('Engineer');
    const organizationSelect = fixture.nativeElement.querySelector('#role-organization') as HTMLSelectElement;
    expect(organizationSelect.value).toBe('org-1');
  });

  it('does not emit saved and shows validation errors for an invalid form', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    findButton(fixture.nativeElement, 'Save role').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.savedValue).toBeUndefined();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Enter a job title.');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Select an organization.');
  });

  it('emits saved with an existing organization id when selected', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const jobTitleInput = fixture.nativeElement.querySelector('#role-job-title') as HTMLInputElement;
    jobTitleInput.value = 'Engineer';
    jobTitleInput.dispatchEvent(new Event('input'));

    const organizationSelect = fixture.nativeElement.querySelector('#role-organization') as HTMLSelectElement;
    organizationSelect.value = 'org-1';
    organizationSelect.dispatchEvent(new Event('change'));

    const startDateInput = fixture.nativeElement.querySelector('#role-start-date') as HTMLInputElement;
    startDateInput.value = '2024-05-01';
    startDateInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    findButton(fixture.nativeElement, 'Save role').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.savedValue).toMatchObject({
      jobTitle: 'Engineer',
      organizationId: 'org-1',
      startDate: '2024-05-01',
    });
  });

  it('reveals a new-organization name field and requires it when "+ New organization" is selected', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const organizationSelect = fixture.nativeElement.querySelector('#role-organization') as HTMLSelectElement;
    organizationSelect.value = '__new__';
    organizationSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#role-new-organization-name')).not.toBeNull();

    findButton(fixture.nativeElement, 'Save role').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.savedValue).toBeUndefined();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Enter the organization name.');
  });

  it('emits cancelled when Cancel is clicked', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    findButton(fixture.nativeElement, 'Cancel').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.cancelledCount).toBe(1);
  });

  it('resets to a blank form when resetToken changes in create mode', async () => {
    const fixture = TestBed.createComponent(RoleForm);
    await fixture.whenStable();

    const jobTitleInput = fixture.nativeElement.querySelector('#role-job-title') as HTMLInputElement;
    jobTitleInput.value = 'Draft title';
    jobTitleInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    fixture.componentRef.setInput('resetToken', 1);
    await fixture.whenStable();

    expect((fixture.nativeElement.querySelector('#role-job-title') as HTMLInputElement).value).toBe('');
  });
});
