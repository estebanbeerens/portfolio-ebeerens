import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { IMAGE_LOADER } from '@angular/common';
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

// Bounds how long bootstrap waits for flags before rendering ungated (guards against a slow/unreachable API).
const FEATURE_FLAGS_INIT_TIMEOUT_MS = 3000;

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
    // serialized HTML already reflects the final state — otherwise hydration flips nav/footer from
    // ungated to gated after first paint, a real user-visible layout shift (not just a CSR flash).
    // The API origin is reliable on the server too (app.config.server.ts pins an absolute API_URL),
    // and the timeout/catchError below still guard against a slow/unreachable API either way.
    provideAppInitializer(() => {
      const content = inject(PortfolioContentService);
      return firstValueFrom(
        toObservable(content.portfolio.status).pipe(
          filter((status) => status !== 'idle' && status !== 'loading'),
          timeout(FEATURE_FLAGS_INIT_TIMEOUT_MS),
          catchError(() => of(undefined))
        )
      );
    }),
  ],
};
