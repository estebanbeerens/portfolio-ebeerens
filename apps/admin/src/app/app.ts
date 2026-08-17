import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthService } from '@portfolio-ebeerens/api-client';
import { ThemeToggle } from '@portfolio-ebeerens/ui';

type AuthState = 'checking' | 'loggedOut' | 'authenticated';

@Component({
  selector: 'app-root',
  imports: [ThemeToggle],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly authService = inject(AuthService);

  protected readonly unauthorized =
    this.isBrowser && new URLSearchParams(window.location.search).get('error') === 'unauthorized';

  // Cookie is HttpOnly, so the SPA can only learn its auth state via a server round-trip.
  // Gating params on isBrowser (undefined = skip) avoids querying it during SSR.
  private readonly session = rxResource({
    params: () => (this.isBrowser ? true : undefined),
    stream: () => this.authService.authControllerMe(),
  });

  protected readonly githubUserId = computed(() => this.session.value()?.githubUserId ?? null);

  protected readonly authState = computed<AuthState>(() => {
    if (!this.isBrowser || this.session.isLoading()) {
      return 'checking';
    }
    return this.session.error() ? 'loggedOut' : 'authenticated';
  });

  protected logout(): void {
    this.authService.authControllerLogout().subscribe({
      complete: () => window.location.reload(),
    });
  }
}
