import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'list',
    loadComponent: () =>
      import('./list/list.component').then((m) => m.GradeListComponent),
    data: {
      title: `Category / List`,
    },
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create/create.component').then(
        (m) => m.CreateCategoryComponent
      ),
    data: {
      title: `Category / Create`,
    },
  },
  {
    path: 'update/:id',
    loadComponent: () =>
      import('./update/update.component').then(
        (m) => m.UpdateCategoryComponent
      ),
    data: {
      title: `Category / Update`,
    },
  },
];