import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AmbientBackdrop, Button } from '@portfolio-ebeerens/ui';
import { SessionService } from '../auth/session.service';

@Component({
  selector: 'admin-login',
  imports: [AmbientBackdrop, Button, RouterLink],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly session = inject(SessionService);

  protected readonly authState = this.session.state;
  protected readonly displayName = this.session.displayName;

  protected readonly unauthorized =
    this.isBrowser && new URLSearchParams(window.location.search).get('error') === 'unauthorized';

  protected logout(): void {
    this.session.logout();
  }
}
