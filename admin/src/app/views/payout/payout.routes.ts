import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'request',
    loadComponent: () =>
      import('./list/list.component').then(
        (m) => m.ListComponent
      ),
    data: {
      title: `Request Payout`,
    },
  },
  {
    path: 'request/:id',
    loadComponent: () =>
      import('./detail/detail.component').then(
        (m) => m.DetailComponent
      ),
    data: {
      title: `Detail Payout`,
    },
  },
];
