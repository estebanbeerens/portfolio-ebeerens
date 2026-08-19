import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../toast.service';

@Component({
  selector: 'ui-toast',
  templateUrl: './toast.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toast {
  protected readonly toastService = inject(ToastService);

  protected variantClass(variant: 'success' | 'error'): string {
    return variant === 'success' ? 'border-success/40 text-success' : 'border-error/40 text-error';
  }
}
