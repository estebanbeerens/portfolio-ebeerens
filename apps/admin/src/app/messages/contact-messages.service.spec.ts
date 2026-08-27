import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ContactMessageDto, ContactService } from '@portfolio-ebeerens/api-client';
import { of } from 'rxjs';
import { ContactMessagesService } from './contact-messages.service';

const readMessage: ContactMessageDto = {
  id: 'message-1',
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  subject: 'Project inquiry',
  message: 'Can we talk about a project?',
  isRead: true,
  createdAt: '2026-08-20T00:00:00.000Z',
};

const unreadMessage: ContactMessageDto = { ...readMessage, id: 'message-2', isRead: false };

@Component({ template: '' })
class HostComponent {
  readonly service = inject(ContactMessagesService);
}

describe('ContactMessagesService', () => {
  async function configure(api: Partial<ContactService>) {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: ContactService, useValue: api }],
    }).compileComponents();

    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    return { service: fixture.componentInstance.service, fixture };
  }

  it('computes the unread count from the fetched list', async () => {
    const { service } = await configure({
      contactControllerFindAll: vi.fn(() => of([readMessage, unreadMessage])) as never,
    });

    expect(service.unreadCount()).toBe(1);
  });

  it('reloads the list after marking a message read', async () => {
    const update = vi.fn(() => of({ ...unreadMessage, isRead: true }));
    const findAll = vi.fn(() => of([unreadMessage]));
    const { service, fixture } = await configure({
      contactControllerFindAll: findAll as never,
      contactControllerUpdate: update as never,
    });
    findAll.mockClear();

    service.setRead('message-2', true).subscribe();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(update).toHaveBeenCalledWith('message-2', { isRead: true });
    expect(findAll).toHaveBeenCalled();
  });

  it('reloads the list after removing a message', async () => {
    const remove = vi.fn(() => of(undefined));
    const findAll = vi.fn(() => of([unreadMessage]));
    const { service, fixture } = await configure({
      contactControllerFindAll: findAll as never,
      contactControllerRemove: remove as never,
    });
    findAll.mockClear();

    service.remove('message-2').subscribe();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(remove).toHaveBeenCalledWith('message-2');
    expect(findAll).toHaveBeenCalled();
  });
});
