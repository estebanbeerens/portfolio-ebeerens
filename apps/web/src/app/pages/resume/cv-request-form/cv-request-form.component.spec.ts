import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CvRequestForm } from './cv-request-form.component';

describe('CvRequestForm', () => {
  async function build() {
    await TestBed.configureTestingModule({
      imports: [CvRequestForm],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CvRequestForm);
    await fixture.whenStable();
    return fixture;
  }

  it('starts without consent and downloads anonymously without verification', async () => {
    const fixture = await build();
    const submitted = vi.fn();
    fixture.componentInstance.submitted.subscribe(submitted);
    expect((fixture.nativeElement.querySelector('#cv-consent') as HTMLInputElement).checked).toBe(false);
    fixture.componentInstance['submit']();
    expect(submitted).toHaveBeenCalledWith({});
  });

  it('shows only one download button and does not submit invalid optional details', async () => {
    const fixture = await build();
    const submitted = vi.fn();
    fixture.componentInstance.submitted.subscribe(submitted);
    fixture.componentInstance['form'].patchValue({ fullName: 'Jane', email: 'invalid' });
    fixture.componentInstance['submit']();
    expect(fixture.nativeElement.querySelectorAll('button')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).not.toContain('Skip and download');
    expect(submitted).not.toHaveBeenCalled();
  });

  it('requires consent for filled fields and verification for sharing them', async () => {
    const fixture = await build();
    const submitted = vi.fn();
    fixture.componentInstance.submitted.subscribe(submitted);
    fixture.componentInstance['form'].patchValue({ fullName: 'Jane' });
    fixture.componentInstance['submit']();
    expect(submitted).not.toHaveBeenCalled();
    expect(fixture.componentInstance['error']()).toContain('Agree to storing');
    fixture.componentInstance['form'].patchValue({ consent: true });
    fixture.componentInstance['submit']();
    expect(fixture.componentInstance['error']()).toContain('Complete verification');
  });
});
