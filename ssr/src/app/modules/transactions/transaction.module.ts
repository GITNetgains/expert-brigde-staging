import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {
  ListTransactionComponent,
  AppointmentDetailComponent
} from './components';
import { TranslateModule } from '@ngx-translate/core';
import { SortComponent } from 'src/app/components/uis/sort/sort.component';
import { CourseTransactionListComponent } from './components/course-transaction/list/list.component';
import categoriesResolver from 'src/app/services/resolvers/category.resolver';
import { CourseTransactionDetailComponent } from './components/course-transaction/detail/detail.component';
import { SharedModule } from 'src/app/shared.module';
const routes: Routes = [
  {
    path: '',
    component: ListTransactionComponent,
    resolve: {}
  },
  {
    path: ':id/view',
    component: AppointmentDetailComponent,
    resolve: {}
  },
  {
    path: 'course-transaction',
    component: CourseTransactionListComponent,
    resolve: {
      categories: categoriesResolver
    }
  },
  {
    path: 'course-transaction/:id',
    component: CourseTransactionDetailComponent,
    resolve: {}
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    TranslateModule.forChild(),
    SortComponent,
    SharedModule
  ],
  declarations: [
    ListTransactionComponent,
    AppointmentDetailComponent,
    CourseTransactionDetailComponent,
    CourseTransactionListComponent
  ],
  exports: [ListTransactionComponent, AppointmentDetailComponent]
})
export class TransactionModule {}
