import { TestBed } from '@angular/core/testing';
import { EducationDto } from '@portfolio-ebeerens/api-client';
import { EducationDeleteDialog } from './education-delete-dialog.component';

const education = {
  id: 'edu-1',
  degree: 'BSc',
  institution: { id: 'inst-1', name: 'University', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  startDate: '2020-01-01',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
} as EducationDto;
describe('EducationDeleteDialog', () => {
  beforeEach(async () => TestBed.configureTestingModule({ imports: [EducationDeleteDialog] }).compileComponents());
  it('renders the selected education', async () => {
    const fixture = TestBed.createComponent(EducationDeleteDialog);
    fixture.componentRef.setInput('education', education);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Delete BSc?');
  });
});
