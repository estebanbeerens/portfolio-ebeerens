import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ContactMessageDto } from '@portfolio-ebeerens/api-client';
import { PageHeader, ToastService } from '@portfolio-ebeerens/ui';
import { ContactMessagesService } from './contact-messages.service';
import { MessageDeleteDialog } from './message-delete-dialog/message-delete-dialog.component';
import { MessageDetail } from './message-detail/message-detail.component';
import { MessageList } from './message-list/message-list.component';

type Mutation = 'idle' | 'deleting';

@Component({
  selector: 'admin-messages',
  imports: [MessageDeleteDialog, MessageDetail, MessageList, PageHeader],
  templateUrl: './messages.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-1 flex-col gap-8' },
})
export class Messages {
  private readonly contactMessages = inject(ContactMessagesService);
  private readonly toast = inject(ToastService);

  protected readonly messages = this.contactMessages;
  protected readonly list = this.contactMessages.list;
  protected readonly isLoading = computed(() => this.contactMessages.messages.isLoading());
  protected readonly selectedId = signal<string | undefined>(undefined);
  protected readonly pendingDelete = signal<ContactMessageDto | undefined>(undefined);
  protected readonly mutation = signal<Mutation>('idle');

  protected readonly selected = computed(() =>
    this.contactMessages.list().find((message) => message.id === this.selectedId())
  );
  protected readonly isDeleting = computed(() => this.mutation() === 'deleting');
  protected readonly requestError = computed(() => {
    const error = this.contactMessages.messages.error();
    return error instanceof HttpErrorResponse && error.status === 401
      ? 'Your session has expired. Sign in again to view messages.'
      : error
        ? 'Messages could not be loaded. Try again.'
        : undefined;
  });

  protected select(id: string): void {
    this.selectedId.set(id);
    const message = this.contactMessages.list().find((item) => item.id === id);
    if (message && !message.isRead) {
      this.contactMessages.setRead(id, true).subscribe({
        error: () => this.toast.error('Could not mark the message as read.'),
      });
    }
  }

  protected toggleRead(): void {
    const message = this.selected();
    if (!message) {
      return;
    }
    this.contactMessages.setRead(message.id, !message.isRead).subscribe({
      error: () => this.toast.error('Could not update the message.'),
    });
  }

  protected askToDelete(): void {
    this.pendingDelete.set(this.selected());
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(undefined);
  }

  protected confirmDelete(): void {
    const message = this.pendingDelete();
    if (!message || this.mutation() !== 'idle') {
      return;
    }

    this.mutation.set('deleting');
    this.contactMessages.remove(message.id).subscribe({
      next: () => {
        this.mutation.set('idle');
        this.pendingDelete.set(undefined);
        if (this.selectedId() === message.id) {
          this.selectedId.set(undefined);
        }
        this.toast.success('Message deleted.');
      },
      error: () => {
        this.mutation.set('idle');
        this.pendingDelete.set(undefined);
        this.toast.error('Could not delete the message.');
      },
    });
  }

  protected retry(): void {
    this.contactMessages.reload();
  }
}
