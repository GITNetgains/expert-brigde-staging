import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'list',
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
    data: {
      title: `Contacts / List`,
    },
  },
  {
    path: 'details/:id',
    loadComponent: () =>
      import('./details/detail.component').then((m) => m.DetailComponent),
    data: {
      title: `Contacts / Details`,
    },
  },
];
