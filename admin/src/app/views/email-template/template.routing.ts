import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'list',
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
    data: {
      title: `Templates / List`,
    },
  },
  {
    path: 'update/:id',
    loadComponent: () =>
      import('./update/update.component').then((m) => m.UpdateComponent),
    data: {
      title: `Templates / Update`,
    },
  },
];
