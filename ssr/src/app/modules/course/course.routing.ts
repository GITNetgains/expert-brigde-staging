import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CourseListComponent } from './list/list.component';
import categoriesResolver from 'src/app/services/resolvers/category.resolver';
import { CourseDetailComponent } from './details/detail.component';
import courseDetailResolver from 'src/app/services/resolvers/course-detail.resolver';

const routes: Routes = [
  {
    path: '',
    component: CourseListComponent,
    resolve: {
      categories: categoriesResolver
    }
  },
  {
    path: ':id',
    component: CourseDetailComponent,
    resolve: {
      course: courseDetailResolver
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CourseRoutingModule { }
