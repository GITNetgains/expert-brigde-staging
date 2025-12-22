import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'list',
    loadComponent: () =>
      import('./list/list.component').then((m) => m.GradeListComponent),
    data: {
      title: `Grade / List`,
    },
  },
  {
    path: 'update/:id',
    loadComponent: () =>
      import('./update/update.component').then((m) => m.UpdateGradeComponent),
    data: {
      title: `Grade / Update`,
    },
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create/create.component').then((m) => m.CreateGradeComponent),
    data: {
      title: `Grade / Create`,
    },
  },
];
