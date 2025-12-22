import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'list',
    loadComponent: () =>
      import('./list/listing.component').then((m) => m.ListingComponent),
    data: {
      title: `Reports / List`,
    },
  },
  {
    path: 'details/:id',
    loadComponent: () =>
      import('./details/detail.component').then((m) => m.ReportDetailComponent),
    data: {
      title: `Reports / Details`,
    },
  },
];
