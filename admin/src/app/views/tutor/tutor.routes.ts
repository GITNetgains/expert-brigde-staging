import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
    data: {
      title: 'Tutors / List',
      urls: [{ title: 'Tutors', url: '/tutors/list' }, { title: 'List' }],
    },
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create/create.component').then((m) => m.CreateComponent),
    data: {
      title: 'Tutors / Create',
      urls: [{ title: 'Tutors', url: '/tutors/list' }, { title: 'Create' }],
    },
  },
  {
    path: 'update/:id',
    loadComponent: () =>
      import('./update/update.component').then((m) => m.UpdateComponent),
    data: {
      title: 'Tutors / Update',
      urls: [{ title: 'Tutors', url: '/tutors/list' }, { title: 'Edit' }],
    },
  },
];
