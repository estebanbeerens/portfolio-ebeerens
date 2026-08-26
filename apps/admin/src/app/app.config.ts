import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, TitleStrategy, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideApi } from '@portfolio-ebeerens/api-client';
import { appRoutes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideMarkdown } from 'ngx-markdown';
import { AdminTitleStrategy } from './admin-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      appRoutes,
      withViewTransitions({ skipInitialTransition: true }),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' })
    ),
    { provide: TitleStrategy, useClass: AdminTitleStrategy },
    provideHttpClient(),
    // Generated paths already include the API's global "/api" prefix — leave basePath empty.
    provideApi({ basePath: '', withCredentials: true }),
    provideMarkdown(),
  ],
};
