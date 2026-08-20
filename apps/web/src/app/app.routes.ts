import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./home/home-page.component').then((component) => component.HomePage),
  },
  {
    path: 'resume',
    loadComponent: () => import('./pages/resume/resume-page.component').then((component) => component.ResumePage),
  },
  {
    path: 'projects',
    loadComponent: () => import('./pages/projects/projects-page.component').then((component) => component.ProjectsPage),
  },
  {
    path: 'projects/:slug',
    loadComponent: () =>
      import('./pages/project-detail/project-detail-page.component').then((component) => component.ProjectDetailPage),
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact-page.component').then((component) => component.ContactPage),
  },
];
