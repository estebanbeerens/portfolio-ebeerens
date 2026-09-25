import { TestBed } from '@angular/core/testing';
import { InstitutionsService } from '@portfolio-ebeerens/api-client';
import { EducationList } from './education-list.component';

describe('EducationList', () => {
  beforeEach(async () =>
    TestBed.configureTestingModule({
      imports: [EducationList],
      providers: [{ provide: InstitutionsService, useValue: {} }],
    }).compileComponents()
  );
  it('shows the empty state', async () => {
    const fixture = TestBed.createComponent(EducationList);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No education yet.');
  });
});
