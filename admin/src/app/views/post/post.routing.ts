import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'list',
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
    data: {
      title: `Pages / List`,
    },
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create/create.component').then(
        (m) => m.PostCreateComponent
      ),
    data: {
      title: `Pages / Create`,
    },
  },
  {
    path: 'update/:id',
    loadComponent: () =>
      import('./update/update.component').then(
        (m) => m.UpdateComponent
      ),
    data: {
      title: `Pages / Update`,
    },
  },
];
