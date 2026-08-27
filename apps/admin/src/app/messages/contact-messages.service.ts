import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ContactService } from '@portfolio-ebeerens/api-client';
import { tap } from 'rxjs';

/** Shared admin-wide contact message state so the sidebar badge and the Messages page reuse one fetch. */
@Injectable({ providedIn: 'root' })
export class ContactMessagesService {
  private readonly api = inject(ContactService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly messages = rxResource({
    params: () => (this.isBrowser ? true : undefined),
    stream: () => this.api.contactControllerFindAll(),
  });

  readonly list = computed(() => (this.messages.hasValue() ? this.messages.value() : []));
  readonly unreadCount = computed(() => this.list().filter((message) => !message.isRead).length);

  reload(): void {
    this.messages.reload();
  }

  setRead(id: string, isRead: boolean) {
    return this.api.contactControllerUpdate(id, { isRead }).pipe(tap(() => this.reload()));
  }

  remove(id: string) {
    return this.api.contactControllerRemove(id).pipe(tap(() => this.reload()));
  }
}
