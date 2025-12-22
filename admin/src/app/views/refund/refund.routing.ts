import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'refund-list',
    loadComponent: () =>
      import('./list-request/list-request.component').then((m) => m.ListRequestComponent),
    data: {
      title: `Refund request`,
    },
  },
  {
    path: 'refund-list/:id',
    loadComponent: () =>
      import('./detail/detail.component').then((m) => m.DetailComponent),
    data: {
      title: `Detail`,
    }
  }
];
