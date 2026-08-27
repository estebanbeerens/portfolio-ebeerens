import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContactMessageDto } from '@portfolio-ebeerens/api-client';
import { MessageList } from './message-list.component';

const message: ContactMessageDto = {
  id: 'message-1',
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  subject: 'Project inquiry',
  message: 'Can we talk about a project? '.repeat(10),
  isRead: false,
  createdAt: '2026-08-20T00:00:00.000Z',
};

@Component({
  imports: [MessageList],
  template: `
    <admin-message-list
      [messages]="messages"
      [selectedId]="selectedId"
      [loading]="loading"
      [error]="error"
      (messageSelected)="selected = $event"
      (retry)="retryCount = retryCount + 1"
    />
  `,
})
class HostComponent {
  messages: ContactMessageDto[] = [message];
  selectedId: string | undefined;
  loading = false;
  error: string | undefined;
  selected: string | undefined;
  retryCount = 0;
}

describe('MessageList', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('renders an unread indicator for unread messages', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Jane Doe');
    expect(text).toContain('Unread');
  });

  it('emits select when a message row is clicked', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    (fixture.nativeElement as HTMLElement).querySelector('li button')?.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(fixture.componentInstance.selected).toBe('message-1');
  });

  it('renders a loading state', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.loading = true;
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading messages...');
  });

  it('renders an error state and emits retry', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.error = 'Messages could not be loaded. Try again.';
    await fixture.whenStable();

    (fixture.nativeElement as HTMLElement).querySelector('button')?.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(fixture.componentInstance.retryCount).toBe(1);
  });

  it('renders an empty state', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.messages = [];
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No messages yet.');
  });
});
