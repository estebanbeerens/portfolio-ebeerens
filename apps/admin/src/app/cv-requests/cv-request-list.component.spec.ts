import { TestBed } from '@angular/core/testing';
import { CvRequestList } from './cv-request-list.component';

describe('CvRequestList', () => {
  it('shows an empty page and disables both pagination controls', async () => {
    TestBed.configureTestingModule({ imports: [CvRequestList] });
    const fixture = TestBed.createComponent(CvRequestList);
    fixture.componentRef.setInput('page', { items: [], total: 0, offset: 0 });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No CV requests.');
    expect(
      [...fixture.nativeElement.querySelectorAll('button')].every((button: HTMLButtonElement) => button.disabled)
    ).toBe(true);
  });
});
