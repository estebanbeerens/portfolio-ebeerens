import { TestBed } from '@angular/core/testing';
import { RoleCompanyGroup } from '../../../shared/portfolio-content.service';
import { ProfessionalJourneySection } from './professional-journey-section.component';

const groups: RoleCompanyGroup[] = Array.from({ length: 4 }, (_, index) => ({
  organization: {
    id: `org-${index}`,
    name: `Company ${index}`,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  roles: [
    {
      id: `role-${index}-a`,
      jobTitle: 'Senior Developer',
      organization: {
        id: `org-${index}`,
        name: `Company ${index}`,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      startDate: '2023-01-01',
      skills: [{ id: `skill-${index}`, name: 'Angular' }],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: `role-${index}-b`,
      jobTitle: 'Frontend Engineer',
      organization: {
        id: `org-${index}`,
        name: `Company ${index}`,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      startDate: '2021-01-01',
      endDate: '2022-12-31',
      skills: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ],
  startDate: '2021-01-01',
}));

describe('ProfessionalJourneySection', () => {
  beforeEach(() => {
    // Only fake `Date` — faking timers wholesale hangs `whenStable()`, which relies on real scheduling.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2025-12-15T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('groups multiple positions under a company and discloses extra companies progressively', async () => {
    await TestBed.configureTestingModule({ imports: [ProfessionalJourneySection] }).compileComponents();

    const fixture = TestBed.createComponent(ProfessionalJourneySection);
    fixture.componentRef.setInput('groups', groups);
    await fixture.whenStable();

    let text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Company 0');
    expect(text).toContain('Senior Developer');
    expect(text).toContain('Frontend Engineer');
    // Ongoing role (started Jan 2023, "now" frozen at Dec 2025): inclusive month count is exactly 3 years.
    expect(text).toContain('Jan 2023 - Present · 3 yrs');
    // Closed role (Jan 2021 - Dec 2022): exactly 2 years.
    expect(text).toContain('Jan 2021 - Dec 2022 · 2 yrs');
    // Company total spans the earliest role start to "now" since one role is still ongoing.
    expect(text).toContain('5 yrs');
    expect(text).toContain('Angular');
    expect(text).not.toContain('positions');
    expect(text).not.toContain('Company 3');

    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();
    await fixture.whenStable();

    text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Company 3');
    expect(text).toContain('Show less experience');
  });

  it('shows a single year when a company or role started and ended in the same year', async () => {
    const singleYearGroup: RoleCompanyGroup = {
      organization: { id: 'org-single', name: 'Single Year Co', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      roles: [
        {
          id: 'role-single',
          jobTitle: 'Contractor',
          organization: { id: 'org-single', name: 'Single Year Co', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
          startDate: '2020-03-01',
          endDate: '2020-11-30',
          skills: [],
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
      startDate: '2020-03-01',
      endDate: '2020-11-30',
    };

    await TestBed.configureTestingModule({ imports: [ProfessionalJourneySection] }).compileComponents();
    const fixture = TestBed.createComponent(ProfessionalJourneySection);
    fixture.componentRef.setInput('groups', [singleYearGroup]);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('2020');
    expect(text).not.toContain('2020-2020');
    // Single role: no "total" duration line is shown.
    expect(text).not.toContain('total');
  });
});
