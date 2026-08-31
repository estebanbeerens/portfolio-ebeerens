import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'ui-sidenav',
  templateUrl: './sidenav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'border-border backdrop-blur-glass fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col gap-10 border-r px-6 py-8 transition-transform md:sticky md:top-0 md:h-dvh md:translate-x-0',
    '[class.translate-x-0]': 'open()',
    '[class.-translate-x-full]': '!open()',
    '(document:keydown.escape)': 'closed.emit()',
  },
})
export class Sidenav {
  readonly label = input('Main');
  /** Only affects viewports below `md`, where the rail becomes an off-canvas drawer. */
  readonly open = input(false);
  readonly closed = output<void>();
}
