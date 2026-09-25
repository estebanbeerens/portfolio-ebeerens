import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { EducationDto } from '@portfolio-ebeerens/api-client';
import { Button } from '@portfolio-ebeerens/ui';
@Component({
  selector: 'admin-education-delete-dialog',
  imports: [Button],
  templateUrl: './education-delete-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationDeleteDialog {
  readonly education = input<EducationDto>();
  readonly deleting = input(false);
  readonly confirm = output<void>();
  readonly dismiss = output<void>();
}
