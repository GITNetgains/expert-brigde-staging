import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'profile/update',
    loadComponent: () =>
      import('./profile/profile-update.component').then(
        (m) => m.ProfileUpdateComponent
      ),
    data: {
      title: 'Users / Profile update',
    },
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create/create.component').then((m) => m.CreateComponent),
    data: {
      title: 'Users / Create',
    },
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
    data: {
      title: 'Users / List',
    },
  },
  {
    path: 'update/:id',
    loadComponent: () =>
      import('./update/update.component').then((m) => m.UpdateComponent),
    data: {
      title: 'Users / Update',
    },
  },
];
