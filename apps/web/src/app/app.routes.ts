import { inject } from '@angular/core';
import { Route } from '@angular/router';
import { PortfolioContentService } from './shared/portfolio-content.service';

export const appRoutes: Route[] = [
  {
    path: '',
    title: 'Home',
    loadComponent: () => import('./home/home-page.component').then((component) => component.HomePage),
  },
  {
    path: 'resume',
    title: 'Resume',
    canMatch: [() => inject(PortfolioContentService).resumeEnabled()],
    loadComponent: () => import('./pages/resume/resume-page.component').then((component) => component.ResumePage),
  },
  {
    path: 'projects',
    title: 'Projects',
    loadComponent: () => import('./pages/projects/projects-page.component').then((component) => component.ProjectsPage),
  },
  {
    path: 'projects/:slug',
    title: 'Project',
    loadComponent: () =>
      import('./pages/project-detail/project-detail-page.component').then((component) => component.ProjectDetailPage),
  },
  {
    path: 'contact',
    title: 'Contact',
    loadComponent: () => import('./pages/contact/contact-page.component').then((component) => component.ContactPage),
  },
  {
    path: '**',
    title: 'Page not found',
    loadComponent: () =>
      import('./pages/not-found/not-found-page.component').then((component) => component.NotFoundPage),
  },
];
