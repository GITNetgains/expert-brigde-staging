import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'list',
    loadComponent: () =>
      import('./list/list.component').then(
        (m) => m.AppointmentListingComponent
      ),
    data: {
      title: `Appointments / List`,
    },
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./detail/detail.component').then(
        (m) => m.DetailComponent
      ),
    data: {
      title: `Appointments / Detail`,
    },
  },
];
