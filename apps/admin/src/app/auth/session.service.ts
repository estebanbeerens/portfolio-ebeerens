import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthService } from '@portfolio-ebeerens/api-client';

export type SessionState = 'checking' | 'loggedOut' | 'authenticated';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly authService = inject(AuthService);

  // Cookie is HttpOnly, so the SPA can only learn its auth state via a server round-trip.
  // Gating params on isBrowser (undefined = skip) avoids querying it during SSR.
  private readonly session = rxResource({
    params: () => (this.isBrowser ? true : undefined),
    stream: () => this.authService.authControllerMe(),
  });

  // resource.value() throws while the resource is in an error state, so gate on hasValue().
  readonly githubUserId = computed(() => (this.session.hasValue() ? this.session.value().githubUserId : undefined));
  readonly displayName = computed(() => (this.session.hasValue() ? this.session.value().displayName : undefined));
  readonly avatarUrl = computed(() => (this.session.hasValue() ? this.session.value().avatarUrl : undefined));

  readonly state = computed<SessionState>(() => {
    if (!this.isBrowser) {
      return 'checking';
    }
    const status = this.session.status();
    if (status === 'error') {
      return 'loggedOut';
    }
    return status === 'resolved' || status === 'local' ? 'authenticated' : 'checking';
  });

  logout(): void {
    this.authService.authControllerLogout().subscribe({
      complete: () => window.location.reload(),
    });
  }
}
