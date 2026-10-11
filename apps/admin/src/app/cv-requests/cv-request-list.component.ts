import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideArrowLeft, LucideArrowRight, LucideDynamicIcon, LucideTrash2 } from '@lucide/angular';
import { CvRequestDto, CvRequestPageDto } from '@portfolio-ebeerens/api-client';
import { Button } from '@portfolio-ebeerens/ui';

@Component({
  selector: 'admin-cv-request-list',
  imports: [DatePipe, Button, LucideDynamicIcon],
  templateUrl: './cv-request-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvRequestList {
  readonly page = input<CvRequestPageDto>();
  readonly loading = input(false);
  readonly error = input<string>();
  readonly busy = input(false);
  readonly remove = output<CvRequestDto>();
  readonly retry = output<void>();
  readonly paginate = output<number>();
  protected readonly trashIcon = LucideTrash2;
  protected readonly previousIcon = LucideArrowLeft;
  protected readonly nextIcon = LucideArrowRight;
}
