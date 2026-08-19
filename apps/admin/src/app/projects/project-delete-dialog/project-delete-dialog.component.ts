import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ProjectDto } from '@portfolio-ebeerens/api-client';
import { Button } from '@portfolio-ebeerens/ui';

/**
 * Presentational delete-confirmation modal for a project.
 */
@Component({
  selector: 'admin-project-delete-dialog',
  imports: [Button],
  templateUrl: './project-delete-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDeleteDialog {
  readonly project = input<ProjectDto>();
  readonly deleting = input(false);

  readonly confirm = output<void>();
  readonly dismiss = output<void>();
}
