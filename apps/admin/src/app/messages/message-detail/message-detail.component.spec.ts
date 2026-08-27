import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContactMessageDto } from '@portfolio-ebeerens/api-client';
import { MessageDetail } from './message-detail.component';

const message: ContactMessageDto = {
  id: 'message-1',
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  organization: 'Acme Inc.',
  subject: 'Project inquiry',
  message: 'Can we talk about a project?',
  isRead: false,
  createdAt: '2026-08-20T00:00:00.000Z',
};

@Component({
  imports: [MessageDetail],
  template: `
    <admin-message-detail
      [message]="message"
      (toggleRead)="toggleCount = toggleCount + 1"
      (delete)="deleteCount = deleteCount + 1"
    />
  `,
})
class HostComponent {
  message: ContactMessageDto | undefined = message;
  toggleCount = 0;
  deleteCount = 0;
}

describe('MessageDetail', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('renders the message fields', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Project inquiry');
    expect(text).toContain('Jane Doe');
    expect(text).toContain('Acme Inc.');
    expect(text).toContain('Can we talk about a project?');
    expect(text).toContain('Mark as read');
  });

  it('shows a placeholder when no message is selected', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.message = undefined;
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Select a message to read it.');
  });

  it('emits toggleRead and delete', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.trim() === 'Mark as read')?.click();
    buttons.find((button) => button.textContent?.trim() === 'Delete')?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.toggleCount).toBe(1);
    expect(fixture.componentInstance.deleteCount).toBe(1);
  });

  it('builds a Gmail compose link with the recipient, subject, and a greeting', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const link = Array.from(fixture.nativeElement.querySelectorAll('a')).find(
      (candidate) => (candidate as HTMLAnchorElement).textContent?.trim() === 'Reply in Gmail'
    ) as HTMLAnchorElement;

    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener noreferrer');
    const url = new URL(link.href);
    expect(url.origin + url.pathname).toBe('https://mail.google.com/mail/');
    expect(url.searchParams.get('to')).toBe('jane@example.com');
    expect(url.searchParams.get('su')).toBe('Re: Project inquiry');
    expect(url.searchParams.get('body')).toBe('Hi Jane Doe,\n\n\n\n---------------\nCan we talk about a project?');
  });
});
