import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EducationDto, InstitutionDto } from '@portfolio-ebeerens/api-client';
import { EducationForm, EducationFormValue } from './education-form.component';

const institution: InstitutionDto = {
  id: 'inst-1',
  name: 'University',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const education: EducationDto = {
  id: 'edu-1',
  degree: 'BSc',
  fieldOfStudy: 'Computer Science',
  institution,
  startDate: '2020-09-01',
  endDate: '2024-06-30',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
@Component({
  imports: [EducationForm],
  template: `<admin-education-form [education]="education" [institutions]="institutions" (saved)="saved = $event" />`,
})
class Host {
  education: EducationDto | undefined;
  institutions = [institution];
  saved: EducationFormValue | undefined;
}

describe('EducationForm', () => {
  beforeEach(async () => TestBed.configureTestingModule({ imports: [Host] }).compileComponents());
  it('shows create mode', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('New education');
  });
  it('populates edit mode', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.education = education;
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Edit education');
    expect((fixture.nativeElement.querySelector('#education-degree') as HTMLInputElement).value).toBe('BSc');
  });
});
