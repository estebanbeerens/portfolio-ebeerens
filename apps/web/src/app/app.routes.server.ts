import { RenderMode, ServerRoute } from '@angular/ssr';
import type { ProjectDto } from '@portfolio-ebeerens/api-client';

// Absolute URL needed because getPrerenderParams runs at build time, with no incoming request to resolve a relative URL against.
const API_BASE_URL = process.env['API_URL'] ?? 'http://localhost:3000';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'projects/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/projects`);
        if (!response.ok) {
          return [];
        }
        const projects = (await response.json()) as ProjectDto[];
        return projects.map((project) => ({ slug: project.slug }));
      } catch {
        // API unreachable at build time — these paths fall back to on-demand SSR instead (PrerenderFallback.Server default).
        return [];
      }
    },
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
