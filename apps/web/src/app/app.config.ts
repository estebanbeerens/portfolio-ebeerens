import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { IMAGE_LOADER, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, TitleStrategy, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideApi } from '@portfolio-ebeerens/api-client';
import { catchError, firstValueFrom, filter, of, timeout } from 'rxjs';
import { appRoutes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { PortfolioContentService } from './shared/portfolio-content.service';
import { PortfolioTitleStrategy } from './portfolio-title.strategy';
import { r2ProjectImageLoader } from './shared/r2-image-loader';

// Bounds how long bootstrap waits for flags/profile before rendering ungated (guards against a slow/unreachable API).
// The server gets a much longer budget: a slow SSR fetch only delays TTFB, whereas timing out on the
// server ships ungated HTML that the (usually-faster) browser fetch then flips post-hydration — a real,
// user-visible layout shift, not just an SSR/CSR nicety. The browser budget stays tight so a bad client
// connection doesn't block interactivity for too long.
const FEATURE_FLAGS_INIT_TIMEOUT_MS = 3000;
const FEATURE_FLAGS_SSR_INIT_TIMEOUT_MS = 9000;

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      appRoutes,
      withViewTransitions({ skipInitialTransition: true }),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' })
    ),
    { provide: TitleStrategy, useExisting: PortfolioTitleStrategy },
    { provide: IMAGE_LOADER, useValue: r2ProjectImageLoader },
    provideHttpClient(),
    // Generated paths already include the API's global "/api" prefix — leave basePath empty.
    provideApi({ basePath: '', withCredentials: true }),
    // Resolve feature flags/profile once before the app renders, on server AND browser, so SSR's
    // serialized HTML already reflects the final state — otherwise hydration flips nav/footer/home
    // sections from ungated to gated after first paint, a real user-visible layout shift.
    // The API origin is reliable on the server too (app.config.server.ts pins an absolute API_URL).
    provideAppInitializer(() => {
      const content = inject(PortfolioContentService);
      const timeoutMs = isPlatformBrowser(inject(PLATFORM_ID))
        ? FEATURE_FLAGS_INIT_TIMEOUT_MS
        : FEATURE_FLAGS_SSR_INIT_TIMEOUT_MS;
      return firstValueFrom(
        toObservable(content.portfolio.status).pipe(
          filter((status) => status !== 'idle' && status !== 'loading'),
          timeout(timeoutMs),
          catchError(() => of(undefined))
        )
      );
    }),
  ],
};
