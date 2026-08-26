import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { IMAGE_LOADER, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { provideHttpClient, withFetch } from '@angular/common/http';
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
    provideRouter(appRoutes, withViewTransitions(), withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    { provide: TitleStrategy, useExisting: PortfolioTitleStrategy },
    { provide: IMAGE_LOADER, useValue: r2ProjectImageLoader },
    provideHttpClient(withFetch()),
    // Generated paths already include the API's global "/api" prefix — leave basePath empty.
    provideApi({ basePath: '', withCredentials: true }),
    // Resolve feature flags once before the app renders, so nav/pages never flash ungated content.
    // Browser-only: during SSR/prerendering there's no reliable network context to block bootstrap on
    // (mirrors the isPlatformBrowser guard pattern already used for admin's session checks).
    provideAppInitializer(() => {
      if (!isPlatformBrowser(inject(PLATFORM_ID))) {
        return Promise.resolve();
      }

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
