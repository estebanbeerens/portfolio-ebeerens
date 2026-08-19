import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OrganizationDto, RoleDto } from '@portfolio-ebeerens/api-client';
import { OrganizationUpdate, RoleGroup, RoleGroupList } from './role-group-list.component';

const organization: OrganizationDto = {
  id: 'org-1',
  name: 'Acme Corp',
  website: 'https://acme.example.com',
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

const seniorRole: RoleDto = {
  id: 'role-2',
  jobTitle: 'Senior Engineer',
  organization,
  employmentType: 'FULL_TIME',
  startDate: '2024-01-01',
  skills: [{ id: 'skill-1', name: 'Angular' }],
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

const juniorRole: RoleDto = {
  id: 'role-1',
  jobTitle: 'Engineer',
  organization,
  startDate: '2022-01-01',
  endDate: '2023-12-31',
  skills: [],
  createdAt: '2022-01-01T00:00:00.000Z',
  updatedAt: '2022-01-01T00:00:00.000Z',
};

const group: RoleGroup = { organization, roles: [seniorRole, juniorRole] };

@Component({
  imports: [RoleGroupList],
  template: `
    <admin-role-group-list
      [groups]="groups"
      [loading]="loading"
      [error]="error"
      (create)="createCount = createCount + 1"
      (edit)="edited = $event"
      (delete)="deleted = $event"
      (retry)="retryCount = retryCount + 1"
      (updateOrganization)="organizationUpdate = $event"
    />
  `,
})
class HostComponent {
  groups: RoleGroup[] | undefined = [group];
  loading = false;
  error: string | undefined;
  createCount = 0;
  retryCount = 0;
  edited: RoleDto | undefined;
  deleted: RoleDto | undefined;
  organizationUpdate: OrganizationUpdate | undefined;
}

describe('RoleGroupList', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('renders every role under its organization group', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Acme Corp');
    expect(text).toContain('Senior Engineer');
    expect(text).toContain('Engineer');
    expect(text).toContain('Angular');
  });

  it('renders a loading state', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.loading = true;
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading professional journey...');
  });

  it('renders an error state and emits retry', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.error = 'Your professional journey could not be loaded. Try again.';
    await fixture.whenStable();

    const retryButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'Try again'
    ) as HTMLButtonElement;
    retryButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.retryCount).toBe(1);
  });

  it('renders an empty state and emits create', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.groups = [];
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No roles yet.');

    const createButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'Add your first role'
    ) as HTMLButtonElement;
    createButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.createCount).toBe(1);
  });

  it('emits edit and delete for a role row', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    (buttons.find((button) => button.textContent?.trim() === 'Edit') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.edited).toEqual(seniorRole);

    const deleteButtons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    (deleteButtons.find((button) => button.textContent?.trim() === 'Delete') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.deleted).toEqual(seniorRole);
  });

  it('edits organization logo and website inline and emits the update', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const editOrgButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'Edit organization'
    ) as HTMLButtonElement;
    editOrgButton.click();
    fixture.detectChanges();

    const websiteInput = fixture.nativeElement.querySelector('#org-website-org-1') as HTMLInputElement;
    websiteInput.value = 'https://acme.example.org';
    websiteInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const saveButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'Save'
    ) as HTMLButtonElement;
    saveButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.organizationUpdate).toMatchObject({
      id: 'org-1',
      website: 'https://acme.example.org',
    });
  });
});
