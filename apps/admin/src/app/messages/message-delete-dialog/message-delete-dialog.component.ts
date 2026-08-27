import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ContactMessageDto } from '@portfolio-ebeerens/api-client';
import { Button } from '@portfolio-ebeerens/ui';

/**
 * Presentational delete-confirmation modal for a contact message.
 */
@Component({
  selector: 'admin-message-delete-dialog',
  imports: [Button],
  templateUrl: './message-delete-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageDeleteDialog {
  readonly message = input<ContactMessageDto>();
  readonly deleting = input(false);

  readonly confirm = output<void>();
  readonly dismiss = output<void>();
}
