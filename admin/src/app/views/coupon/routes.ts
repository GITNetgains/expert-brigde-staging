import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'list',
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListCouponComponent),
    data: {
      title: `Coupon / List`,
    },
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create/create.component').then((m) => m.CreateCouponComponent),
    data: {
      title: `Coupon / Create`,
    },
  },
  {
    path: 'update/:id',
    loadComponent: () =>
      import('./update/update.component').then((m) => m.UpdateCouponComponent),
    data: {
      title: `Coupon / Update`,
    },
  },
];
