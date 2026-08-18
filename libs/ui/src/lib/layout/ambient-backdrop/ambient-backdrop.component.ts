import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Decorative blurred colour blobs sitting behind page content. */
@Component({
  selector: 'ui-ambient-backdrop',
  templateUrl: './ambient-backdrop.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pointer-events-none absolute inset-0 z-0 block overflow-hidden',
    'aria-hidden': 'true',
  },
})
export class AmbientBackdrop {}
