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
        loadComponent: () => import('./layout/placeholder-page.component').then((m) => m.PlaceholderPage),
        data: { title: 'Basic Info', subtitle: 'Your profile, headline, bio and resume.' },
      },
      {
        path: 'professional-journey',
        loadComponent: () => import('./layout/placeholder-page.component').then((m) => m.PlaceholderPage),
        data: { title: 'Professional Journey', subtitle: 'Organizations and the roles you held.' },
      },
      {
        path: 'projects',
        loadComponent: () => import('./projects/projects.component').then((m) => m.Projects),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
