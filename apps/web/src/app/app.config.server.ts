import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { provideApi } from '@portfolio-ebeerens/api-client';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Overrides the browser's relative basePath: SSR/prerendering has no incoming request to
    // resolve a relative URL against, so the server bundle needs an absolute API origin instead.
    provideApi({ basePath: process.env['API_URL'] ?? 'http://localhost:3000', withCredentials: true }),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
