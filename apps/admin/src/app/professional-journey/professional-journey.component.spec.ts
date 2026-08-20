import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  OrganizationDto,
  OrganizationsService,
  RoleDto,
  RolesService,
  SkillsService,
} from '@portfolio-ebeerens/api-client';
import { provideMarkdown } from 'ngx-markdown';
import { ProfessionalJourney } from './professional-journey.component';

const organization: OrganizationDto = {
  id: 'org-1',
  name: 'Acme Corp',
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
};

const seniorRole: RoleDto = {
  id: 'role-2',
  jobTitle: 'Senior Engineer',
  organization,
  startDate: '2024-01-01',
  skills: [],
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

describe('ProfessionalJourney', () => {
  function configure(rolesApi: Partial<RolesService>, organizationsApi: Partial<OrganizationsService> = {}) {
    TestBed.configureTestingModule({
      imports: [ProfessionalJourney],
      providers: [
        provideRouter([]),
        provideMarkdown(),
        { provide: RolesService, useValue: rolesApi },
        {
          provide: OrganizationsService,
          useValue: { organizationsControllerFindAll: () => of([organization]), ...organizationsApi },
        },
        { provide: SkillsService, useValue: { skillsControllerFindAll: () => of([]) } },
      ],
    });
  }

  it('groups multiple roles under a single organization', async () => {
    configure({ rolesControllerFindAll: vi.fn(() => of([seniorRole, juniorRole])) as never });

    const fixture = TestBed.createComponent(ProfessionalJourney);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Acme Corp');
    expect(text).toContain('Senior Engineer');
    expect(text).toContain('Engineer');
    // Only one organization heading should render even though it has two roles.
    const headings = (fixture.nativeElement as HTMLElement).querySelectorAll('h2');
    const acmeHeadings = Array.from(headings).filter((heading) => heading.textContent?.trim() === 'Acme Corp');
    expect(acmeHeadings).toHaveLength(1);
  });

  it('renders an empty state when no roles exist', async () => {
    configure({ rolesControllerFindAll: vi.fn(() => of([])) as never });

    const fixture = TestBed.createComponent(ProfessionalJourney);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No roles yet.');
  });

  it('does not submit an invalid role form', async () => {
    const create = vi.fn();
    configure({
      rolesControllerFindAll: vi.fn(() => of([])) as never,
      rolesControllerCreate: create as never,
    });

    const fixture = TestBed.createComponent(ProfessionalJourney);
    await fixture.whenStable();
    const newRoleButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'New role'
    ) as HTMLButtonElement;
    newRoleButton.click();
    fixture.detectChanges();
    const saveButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'Save role'
    ) as HTMLButtonElement;
    saveButton.click();
    fixture.detectChanges();

    expect(create).not.toHaveBeenCalled();
  });

  it('creates a role with an existing organization without creating a new one', async () => {
    const createOrganization = vi.fn();
    const createRole = vi.fn(() => of(seniorRole));
    configure(
      { rolesControllerFindAll: vi.fn(() => of([])) as never, rolesControllerCreate: createRole as never },
      { organizationsControllerCreate: createOrganization as never }
    );

    const fixture = TestBed.createComponent(ProfessionalJourney);
    await fixture.whenStable();
    (
      Array.from(fixture.nativeElement.querySelectorAll('button')).find(
        (button) => (button as HTMLButtonElement).textContent?.trim() === 'New role'
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    const jobTitleInput = fixture.nativeElement.querySelector('#role-job-title') as HTMLInputElement;
    jobTitleInput.value = 'Engineer';
    jobTitleInput.dispatchEvent(new Event('input'));
    const organizationSelect = fixture.nativeElement.querySelector('#role-organization') as HTMLSelectElement;
    organizationSelect.value = 'org-1';
    organizationSelect.dispatchEvent(new Event('change'));
    const descriptionInput = fixture.nativeElement.querySelector('#role-description') as HTMLTextAreaElement;
    descriptionInput.value = 'Built **accessible** interfaces.';
    descriptionInput.dispatchEvent(new Event('input'));
    const startDateInput = fixture.nativeElement.querySelector('#role-start-date') as HTMLInputElement;
    startDateInput.value = '2024-05-01';
    startDateInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    (
      Array.from(fixture.nativeElement.querySelectorAll('button')).find(
        (button) => (button as HTMLButtonElement).textContent?.trim() === 'Save role'
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(createOrganization).not.toHaveBeenCalled();
    expect(createRole).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-1', description: 'Built **accessible** interfaces.' })
    );
  });

  it('switches the optional role description to a sanitized preview with semantic tab state', async () => {
    configure({ rolesControllerFindAll: vi.fn(() => of([])) as never });

    const fixture = TestBed.createComponent(ProfessionalJourney);
    await fixture.whenStable();
    (
      Array.from(fixture.nativeElement.querySelectorAll('button')).find(
        (button) => (button as HTMLButtonElement).textContent?.trim() === 'New role'
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    tabs[1].click();
    await fixture.whenStable();

    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(fixture.nativeElement.querySelector('#role-description-panel ui-markdown')).not.toBeNull();
  });

  it('creates the organization first when "+ New organization" is chosen, then creates the role', async () => {
    const createOrganization = vi.fn(() => of({ ...organization, id: 'org-2', name: 'New Co' }));
    const createRole = vi.fn(() => of(seniorRole));
    configure(
      { rolesControllerFindAll: vi.fn(() => of([])) as never, rolesControllerCreate: createRole as never },
      { organizationsControllerCreate: createOrganization as never }
    );

    const fixture = TestBed.createComponent(ProfessionalJourney);
    await fixture.whenStable();
    (
      Array.from(fixture.nativeElement.querySelectorAll('button')).find(
        (button) => (button as HTMLButtonElement).textContent?.trim() === 'New role'
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    const jobTitleInput = fixture.nativeElement.querySelector('#role-job-title') as HTMLInputElement;
    jobTitleInput.value = 'Engineer';
    jobTitleInput.dispatchEvent(new Event('input'));
    const organizationSelect = fixture.nativeElement.querySelector('#role-organization') as HTMLSelectElement;
    organizationSelect.value = '__new__';
    organizationSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    const newOrgInput = fixture.nativeElement.querySelector('#role-new-organization-name') as HTMLInputElement;
    newOrgInput.value = 'New Co';
    newOrgInput.dispatchEvent(new Event('input'));
    const startDateInput = fixture.nativeElement.querySelector('#role-start-date') as HTMLInputElement;
    startDateInput.value = '2024-05-01';
    startDateInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    (
      Array.from(fixture.nativeElement.querySelectorAll('button')).find(
        (button) => (button as HTMLButtonElement).textContent?.trim() === 'Save role'
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(createOrganization).toHaveBeenCalledWith({ name: 'New Co' });
    expect(createRole).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'org-2' }));
  });

  it('does not call delete when confirmation is cancelled', async () => {
    const remove = vi.fn();
    configure({
      rolesControllerFindAll: vi.fn(() => of([seniorRole])) as never,
      rolesControllerRemove: remove as never,
    });

    const fixture = TestBed.createComponent(ProfessionalJourney);
    await fixture.whenStable();
    const deleteButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'Delete'
    ) as HTMLButtonElement;
    deleteButton.click();
    fixture.detectChanges();
    const cancelButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.trim() === 'Cancel'
    ) as HTMLButtonElement;
    cancelButton.click();
    fixture.detectChanges();

    expect(remove).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('This action cannot be undone.');
  });

  it('explains a failed roles request', async () => {
    configure({ rolesControllerFindAll: vi.fn(() => throwError(() => new Error('offline'))) as never });

    const fixture = TestBed.createComponent(ProfessionalJourney);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Your professional journey could not be loaded. Try again.'
    );
  });
});
