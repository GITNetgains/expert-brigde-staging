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
      import('./list/list.component').then((m) => m.CourseListingComponent),
    data: {
      title: 'Courses / List',
      urls: [{ title: 'Courses', url: '/courses/list' }, { title: 'List' }],
    },
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create/create.component').then((m) => m.CourseCreateComponent),
    data: {
      title: 'Courses / Create',
      urls: [{ title: 'Courses', url: '/courses/list' }, { title: 'Create' }],
    },
  },
  {
    path: 'update/:id',
    loadComponent: () =>
      import('./update/update.component').then((m) => m.CourseUpdateComponent),
    data: {
      title: 'Courses / Update',
      urls: [{ title: 'Courses', url: '/courses/list' }, { title: 'Edit' }],
    },
  },
  {
    path: 'preview/:id',
    loadComponent: () =>
      import('./preview/preview.component').then(
        (m) => m.CoursePreviewComponent
      ),
    data: {
      title: 'Courses / Preview',
      urls: [{ title: 'Courses', url: '/courses/list' }, { title: 'Preview' }],
    },
  },
];
