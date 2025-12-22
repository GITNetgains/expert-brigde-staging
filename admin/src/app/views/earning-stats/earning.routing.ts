import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'list',
    loadComponent: () =>
      import('./list/listing.component').then((m) => m.ListingEarningComponent),
    data: {
      title: `Earning / List`,
    },
  },
  {
    path: 'details/:id',
    loadComponent: () =>
      import('./details/detail.component').then(
        (m) => m.EarningStatsDetailComponent
      ),
    data: {
      title: `Earning / Details`,
    },
  },
];
