import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'list',
    loadComponent: () =>
      import('./list/list.component').then((m) => m.WebinarListComponent),
    data: {
      title: 'Group Class / List',
    },
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create/create.component').then((m) => m.CreateWebinarComponent),
    data: {
      title: 'Group Class / Create',
    },
  },
  {
    path: 'update/:id',
    loadComponent: () =>
      import('./update/update.component').then((m) => m.UpdateWebinarComponent),
    data: {
      title: 'Group Class / Update',
    },
  },
];
