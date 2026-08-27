import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService, ContactMessageDto, ContactService } from '@portfolio-ebeerens/api-client';
import { of } from 'rxjs';
import { AdminShell } from './admin-shell.component';

const authServiceStub = { authControllerMe: vi.fn(() => of({ githubUserId: 'user-1' })) };

const unreadMessage: ContactMessageDto = {
  id: 'message-1',
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  subject: 'Project inquiry',
  message: 'Can we talk about a project?',
  isRead: false,
  createdAt: '2026-08-20T00:00:00.000Z',
};

describe('AdminShell', () => {
  it('shows the unread message count as a badge on the Messages nav item', async () => {
    TestBed.configureTestingModule({
      imports: [AdminShell],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
        { provide: ContactService, useValue: { contactControllerFindAll: vi.fn(() => of([unreadMessage])) } },
      ],
    });

    const fixture = TestBed.createComponent(AdminShell);
    await fixture.whenStable();
    fixture.detectChanges();

    const messagesLink = Array.from(fixture.nativeElement.querySelectorAll('a')).find((link) =>
      (link as HTMLAnchorElement).textContent?.includes('Messages')
    ) as HTMLAnchorElement;
    expect(messagesLink.textContent).toContain('1');
  });

  it('does not show a badge when there are no unread messages', async () => {
    TestBed.configureTestingModule({
      imports: [AdminShell],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
        { provide: ContactService, useValue: { contactControllerFindAll: vi.fn(() => of([])) } },
      ],
    });

    const fixture = TestBed.createComponent(AdminShell);
    await fixture.whenStable();
    fixture.detectChanges();

    const messagesLink = Array.from(fixture.nativeElement.querySelectorAll('a')).find((link) =>
      (link as HTMLAnchorElement).textContent?.includes('Messages')
    ) as HTMLAnchorElement;
    expect(messagesLink.querySelector('.rounded-full.px-1\\.5')).toBeNull();
  });
});
