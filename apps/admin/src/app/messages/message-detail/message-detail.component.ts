import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ContactMessageDto } from '@portfolio-ebeerens/api-client';
import { Button, Card } from '@portfolio-ebeerens/ui';

/**
 * Presentational detail pane for a selected contact message.
 */
@Component({
  selector: 'admin-message-detail',
  imports: [Button, Card, DatePipe],
  templateUrl: './message-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-1' },
})
export class MessageDetail {
  readonly message = input<ContactMessageDto>();

  readonly toggleRead = output<void>();
  readonly delete = output<void>();

  protected readonly gmailComposeUrl = computed(() => {
    const message = this.message();
    if (!message) {
      return undefined;
    }

    const params = new URLSearchParams({
      view: 'cm',
      fs: '1',
      to: message.email,
      su: `Re: ${message.subject}`,
      body: `Hi ${message.fullName},\n\n\n\n---------------\n${message.message}`,
    });
    return `https://mail.google.com/mail/?${params.toString()}`;
  });
}
