import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RoleDto } from '@portfolio-ebeerens/api-client';
import { Button } from '@portfolio-ebeerens/ui';

/**
 * Presentational delete-confirmation modal for a role.
 */
@Component({
  selector: 'admin-role-delete-dialog',
  imports: [Button],
  templateUrl: './role-delete-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleDeleteDialog {
  readonly role = input<RoleDto>();
  readonly deleting = input(false);

  readonly confirm = output<void>();
  readonly dismiss = output<void>();
}
