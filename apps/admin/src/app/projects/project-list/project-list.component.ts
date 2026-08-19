import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ProjectDto } from '@portfolio-ebeerens/api-client';
import { Button, Card } from '@portfolio-ebeerens/ui';

/**
 * Presentational list of projects: loading/error/empty states plus create/edit/delete triggers.
 */
@Component({
  selector: 'admin-project-list',
  imports: [Button, Card, DatePipe],
  templateUrl: './project-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-1' },
})
export class ProjectList {
  readonly projects = input<ProjectDto[]>();
  readonly loading = input(false);
  readonly error = input<string>();

  readonly create = output<void>();
  readonly edit = output<ProjectDto>();
  readonly delete = output<ProjectDto>();
  readonly retry = output<void>();
}
