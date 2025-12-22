import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'list',
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListTopicComponent),
    data: {
      title: `Topic / List`,
    },
  },
  {
    path: 'update/:id',
    loadComponent: () =>
      import('./update/update').then((m) => m.UpdateTopicComponent),
    data: {
      title: `Topic / Update`,
    },
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create/create').then((m) => m.CreateTopicComponent),
    data: {
      title: `Topic / Create`,
    },
  },
];
