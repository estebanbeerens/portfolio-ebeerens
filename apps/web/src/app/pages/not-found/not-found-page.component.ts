import { ChangeDetectionStrategy, Component, inject, RESPONSE_INIT } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Button } from '@portfolio-ebeerens/ui';
import { PortfolioTitleStrategy } from '../../portfolio-title.strategy';

@Component({
  selector: 'web-not-found-page',
  imports: [Button, RouterLink],
  templateUrl: './not-found-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  constructor() {
    // Router still returns 200 for a matched wildcard route by default; the SSR response needs the
    // real status set explicitly so search engines/monitors don't index/treat this page as success.
    const responseInit = inject(RESPONSE_INIT, { optional: true });
    if (responseInit) {
      responseInit.status = 404;
    }

    inject(Meta).updateTag({ name: 'description', content: 'The page you requested could not be found.' });
    inject(PortfolioTitleStrategy).setPageTitle('Page not found');
  }
}
