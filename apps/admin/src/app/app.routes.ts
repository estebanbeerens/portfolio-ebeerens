import { Route } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/admin-shell.component').then((m) => m.AdminShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.Dashboard),
      },
      {
        path: 'basic-info',
        loadComponent: () => import('./profile/profile.component').then((m) => m.Profile),
      },
      {
        path: 'professional-journey',
        loadComponent: () =>
          import('./professional-journey/professional-journey.component').then((m) => m.ProfessionalJourney),
        data: { title: 'Professional Journey', subtitle: 'Organizations and the roles you held.' },
      },
      {
        path: 'projects',
        loadComponent: () => import('./projects/projects.component').then((m) => m.Projects),
      },
      {
        path: 'feature-flags',
        loadComponent: () => import('./feature-flags/feature-flags.component').then((m) => m.FeatureFlags),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
