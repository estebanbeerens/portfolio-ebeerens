import { RenderMode, ServerRoute } from '@angular/ssr';

// All content comes from the admin-managed API, which changes without a rebuild/redeploy — build-time
// Prerender would bake in whatever the API returned at image-build time (or an error if it wasn't
// reachable then, see repo memory) and serve that frozen snapshot to every visitor until the next
// deploy. RenderMode.Server renders on every request instead, against the live API at request time.
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
