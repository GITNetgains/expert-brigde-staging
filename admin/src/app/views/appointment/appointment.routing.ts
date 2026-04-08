import { Routes } from '@angular/router';
import { CreateOneOnOneSessionComponent } from './create/create.component';
import { OneOnOneListComponent } from './one-on-one-list/one-on-one-list.component';

export const routes: Routes = [
  {
    path: 'create',
    component: CreateOneOnOneSessionComponent,
    data: {
      title: `Appointments / Create 1on1`,
    },
  },
  {
    path: 'list/one-on-one',
    component: OneOnOneListComponent,
    data: {
      title: `Appointments / 1on1 Availability`,
    },
  },
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
