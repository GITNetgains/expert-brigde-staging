import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: 'list',
    loadComponent: () =>
      import('./list/list.component').then((m) => m.SubjectListComponent),
    data: {
      title: `Subject / List`,
    },
  },
  {
    path: 'update/:id',
    loadComponent: () =>
      import('./update/update').then((m) => m.UpdateSubjectComponent),
    data: {
      title: `Subject / Update`,
    },
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create/create').then((m) => m.CreateSubjectComponent),
    data: {
      title: `Subject / Create`,
    },
  },
];
