import { TestBed } from '@angular/core/testing';
import { ResumeService } from '@portfolio-ebeerens/api-client';
import { of, throwError } from 'rxjs';
import { CvRequests } from './cv-requests.component';

describe('CvRequests', () => {
  const request = {
    id: 'request-1',
    fullName: 'Jane',
    email: 'jane@example.com',
    reason: 'Recruitment',
    createdAt: '2026-10-09T12:00:00Z',
    consentedAt: '2026-10-09T12:00:00Z',
    consentTextVersion: '2026-10-09',
  };

  function configure(fail = false) {
    const api = {
      resumeControllerFindRequests: vi.fn(() =>
        fail ? throwError(() => new Error('offline')) : of({ items: [request], total: 1, offset: 0 })
      ),
      resumeControllerRemoveRequest: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({ imports: [CvRequests], providers: [{ provide: ResumeService, useValue: api }] });
    return api;
  }

  it('shows consented requester details without adding download counts', async () => {
    const api = configure();
    const fixture = TestBed.createComponent(CvRequests);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('jane@example.com');
    expect(fixture.nativeElement.textContent).toContain('2026-10-09');
    expect(api.resumeControllerFindRequests).toHaveBeenCalledWith(0, 'body', false, { transferCache: false });
  });

  it('shows a safe error on failed reads', async () => {
    configure(true);
    const fixture = TestBed.createComponent(CvRequests);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('CV requests could not be loaded');
  });

  it('requires confirmation and deletes the selected request through the protected client', async () => {
    const api = configure();
    const fixture = TestBed.createComponent(CvRequests);
    await fixture.whenStable();
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    Object.defineProperty(dialog, 'showModal', {
      value: vi.fn(() => {
        dialog.open = true;
      }),
    });
    Object.defineProperty(dialog, 'close', {
      value: vi.fn(() => {
        dialog.open = false;
      }),
    });
    (fixture.nativeElement.querySelector('button[title="Delete CV request"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect((fixture.nativeElement.querySelector('dialog') as HTMLDialogElement).open).toBe(true);
    expect(api.resumeControllerRemoveRequest).not.toHaveBeenCalled();
    fixture.componentInstance['remove']();
    await fixture.whenStable();
    expect(api.resumeControllerRemoveRequest).toHaveBeenCalledWith('request-1');
    expect((fixture.nativeElement.querySelector('dialog') as HTMLDialogElement).open).toBe(false);
  });
});
