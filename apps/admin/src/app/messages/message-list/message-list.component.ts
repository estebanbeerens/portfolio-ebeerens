import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ContactMessageDto } from '@portfolio-ebeerens/api-client';
import { Card } from '@portfolio-ebeerens/ui';

/**
 * Presentational inbox-style list of contact messages: loading/error/empty states plus selection.
 */
@Component({
  selector: 'admin-message-list',
  imports: [Card, DatePipe],
  templateUrl: './message-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-1 xl:max-w-sm' },
})
export class MessageList {
  readonly messages = input<ContactMessageDto[]>([]);
  readonly selectedId = input<string | undefined>();
  readonly loading = input(false);
  readonly error = input<string>();

  readonly messageSelected = output<string>();
  readonly retry = output<void>();

  protected preview(message: string): string {
    return message.length > 80 ? `${message.slice(0, 80)}…` : message;
  }
}
