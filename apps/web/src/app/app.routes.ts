import { Routes } from '@angular/router';
import { manageGuard } from './account/manage.guard';
import { signedInGuard } from './account/signed-in.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  {
    path: 'events',
    loadComponent: () => import('./events/events').then((m) => m.Events),
  },
  {
    path: 'where-we-stand',
    loadComponent: () =>
      import('./projects/where-we-stand/where-we-stand').then((m) => m.WhereWeStand),
  },
  {
    path: 'projects/:slug',
    loadComponent: () => import('./projects/project-page/project-page').then((m) => m.ProjectPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./account/login/login').then((m) => m.Login),
  },
  {
    path: 'claim-account',
    loadComponent: () =>
      import('./account/claim-account/claim-account').then((m) => m.ClaimAccount),
  },
  {
    path: 'profile',
    canActivate: [signedInGuard],
    loadComponent: () => import('./account/profile/profile').then((m) => m.Profile),
  },
  {
    path: 'manage',
    canActivate: [manageGuard],
    loadComponent: () => import('./account/manage/manage').then((m) => m.Manage),
  },
];
