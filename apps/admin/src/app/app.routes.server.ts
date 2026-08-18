import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'login',
    renderMode: RenderMode.Prerender,
  },
  {
    // Everything behind the auth guard depends on a browser-only session check.
    path: '**',
    renderMode: RenderMode.Client,
  },
];
