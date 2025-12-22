import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TutorListComponent } from './list/tutor-list.component';
import categoriesResolver from 'src/app/services/resolvers/category.resolver';
import { TutorProfileComponent } from './details/profile.component';
import tutorDetailResolver from 'src/app/services/resolvers/tutor-detail.resolver';
import { BookingComponent } from './booking/booking.component';

const routes: Routes = [
  {
    path: '',
    component: TutorListComponent,
    resolve: {
      // search: TutorSearchResolver,
      categories: categoriesResolver
    }
  },
  {
    path: ':username',
    component: TutorProfileComponent,
    resolve: {
      tutor: tutorDetailResolver
    }
  },
  {
    path: ':username/booking',
    component: BookingComponent,
    resolve: {
      tutor: tutorDetailResolver
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TutorRoutingModule { }
