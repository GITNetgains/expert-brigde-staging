import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'transaction',
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
    data: {
      title: `Manage Transaction`,
    },
  },
  {
    path: 'transaction/:id',
    loadComponent: () =>
      import('./detail/detail.component').then((m) => m.DetailComponent),
    data: {
      title: `Detail Transaction`,
    },
  },
];
