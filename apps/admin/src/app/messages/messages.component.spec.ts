import { TestBed } from '@angular/core/testing';
import { ContactMessageDto, ContactService } from '@portfolio-ebeerens/api-client';
import { of, throwError } from 'rxjs';
import { Messages } from './messages.component';

const readMessage: ContactMessageDto = {
  id: 'message-1',
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  subject: 'Project inquiry',
  message: 'Can we talk about a project?',
  isRead: true,
  createdAt: '2026-08-20T00:00:00.000Z',
};

const unreadMessage: ContactMessageDto = { ...readMessage, id: 'message-2', fullName: 'John Smith', isRead: false };

describe('Messages', () => {
  function configure(api: Partial<ContactService>) {
    TestBed.configureTestingModule({
      imports: [Messages],
      providers: [{ provide: ContactService, useValue: api }],
    });
  }

  function clickByText(fixture: { nativeElement: HTMLElement }, text: string): void {
    const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (candidate) => (candidate as HTMLButtonElement).textContent?.trim() === text
    ) as HTMLButtonElement;
    button.click();
  }

  function selectRow(fixture: { nativeElement: HTMLElement }, fullName: string): void {
    const row = Array.from(fixture.nativeElement.querySelectorAll('li button')).find((candidate) =>
      (candidate as HTMLButtonElement).textContent?.includes(fullName)
    ) as HTMLButtonElement;
    row.click();
  }

  it('renders the message list', async () => {
    configure({ contactControllerFindAll: vi.fn(() => of([readMessage, unreadMessage])) as never });

    const fixture = TestBed.createComponent(Messages);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Jane Doe');
    expect(text).toContain('John Smith');
    expect(text).toContain('Select a message to read it.');
  });

  it('marks an unread message as read when selected', async () => {
    const update = vi.fn(() => of({ ...unreadMessage, isRead: true }));
    configure({
      contactControllerFindAll: vi.fn(() => of([unreadMessage])) as never,
      contactControllerUpdate: update as never,
    });

    const fixture = TestBed.createComponent(Messages);
    await fixture.whenStable();

    selectRow(fixture, 'John Smith');
    fixture.detectChanges();

    expect(update).toHaveBeenCalledWith('message-2', { isRead: true });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Project inquiry');
  });

  it('does not call update when selecting an already-read message', async () => {
    const update = vi.fn();
    configure({
      contactControllerFindAll: vi.fn(() => of([readMessage])) as never,
      contactControllerUpdate: update as never,
    });

    const fixture = TestBed.createComponent(Messages);
    await fixture.whenStable();

    selectRow(fixture, 'Jane Doe');
    fixture.detectChanges();

    expect(update).not.toHaveBeenCalled();
  });

  it('deletes a message after confirming', async () => {
    const remove = vi.fn(() => of(undefined));
    configure({
      contactControllerFindAll: vi.fn(() => of([readMessage])) as never,
      contactControllerRemove: remove as never,
    });

    const fixture = TestBed.createComponent(Messages);
    await fixture.whenStable();

    selectRow(fixture, 'Jane Doe');
    fixture.detectChanges();
    clickByText(fixture, 'Delete');
    fixture.detectChanges();
    clickByText(fixture, 'Delete message');
    fixture.detectChanges();

    expect(remove).toHaveBeenCalledWith('message-1');
  });

  it('explains a failed message request', async () => {
    configure({ contactControllerFindAll: vi.fn(() => throwError(() => new Error('offline'))) as never });

    const fixture = TestBed.createComponent(Messages);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Messages could not be loaded. Try again.');
  });
});
