import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID, PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ResumeService } from '@portfolio-ebeerens/api-client';
import { of, throwError } from 'rxjs';
import { ResumePage } from './resume-page.component';

describe('ResumePage', () => {
  async function build(options: { failed?: boolean; loggingFailed?: boolean; platform?: string } = {}) {
    const api = {
      resumeControllerRequestDownload: vi.fn(() =>
        options.failed
          ? throwError(() => new Error('offline'))
          : of({
              downloadUrl: 'https://download.example/cv.pdf',
              loggingStatus: options.loggingFailed ? 'failed' : 'not-requested',
            })
      ),
    };
    await TestBed.configureTestingModule({
      imports: [ResumePage, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: ResumeService, useValue: api },
        { provide: LOCALE_ID, useValue: 'nl' },
        { provide: PLATFORM_ID, useValue: options.platform || 'browser' },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ResumePage);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    if (options.platform !== 'server') http.expectOne('/runtime-config.json').flush({});
    await fixture.whenStable();
    return { fixture, api, http };
  }

  afterEach(() => vi.restoreAllMocks());

  it('uses the contact heading and form-card treatment without a professional journey', async () => {
    const { fixture } = await build();
    const page = fixture.nativeElement as HTMLElement;
    const heading = page.querySelector('h1');
    const card = page.querySelector('ui-card');
    expect(heading?.textContent).toContain('Download CV');
    expect(heading?.classList.contains('text-4xl')).toBe(true);
    expect(heading?.classList.contains('font-bold')).toBe(true);
    expect(card?.classList.contains('shadow-elevation')).toBe(true);
    expect(card?.getAttribute('density')).toBe('comfortable');
    expect(card?.querySelector('web-cv-request-form')).not.toBeNull();
    expect(page.querySelector('web-professional-journey-section')).toBeNull();
    expect(page.textContent).not.toContain('Skip and download');
  });

  it('downloads anonymously in the current locale without saving details', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const { fixture, api } = await build();
    fixture.componentInstance['download']({});
    expect(api.resumeControllerRequestDownload).toHaveBeenCalledWith({}, 'nl', 'body', false, { transferCache: false });
    expect(click).toHaveBeenCalledOnce();
    expect(fixture.componentInstance['status']()).toContain('ready');
  });

  it('keeps download successful when optional logging fails', async () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const { fixture } = await build({ loggingFailed: true });
    fixture.componentInstance['download']({ fullName: 'Jane', consent: true, turnstileToken: 'token' });
    expect(fixture.componentInstance['status']()).toContain('could not be saved');
    expect(fixture.componentInstance['error']()).toBeUndefined();
  });

  it('shows a retryable download error and resets pending state', async () => {
    const { fixture } = await build({ failed: true });
    fixture.componentInstance['download']({});
    expect(fixture.componentInstance['error']()).toContain('try again');
    expect(fixture.componentInstance['saving']()).toBe(false);
  });

  it('does not initiate a download or verification fetch during SSR', async () => {
    const { fixture, api, http } = await build({ platform: 'server' });
    fixture.componentInstance['download']({});
    expect(api.resumeControllerRequestDownload).not.toHaveBeenCalled();
    http.expectNone('/runtime-config.json');
  });
});
