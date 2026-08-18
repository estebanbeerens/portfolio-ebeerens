import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-activity-list',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex w-full flex-col gap-4',
    role: 'list',
  },
})
export class ActivityList {}
