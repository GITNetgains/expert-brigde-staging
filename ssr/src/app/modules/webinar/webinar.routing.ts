import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import categoriesResolver from 'src/app/services/resolvers/category.resolver';
import { WebinarListingComponent } from './list/list.component';
import { DetailWebinarComponent } from './details/detail.component';
import webinarDetailResolver from 'src/app/services/resolvers/webinar-detail.resolver';

const routes: Routes = [
  {
    path: '',
    component: WebinarListingComponent,
    resolve: {
      categories: categoriesResolver
    }
  },
  {
    path: ':id',
    component: DetailWebinarComponent,
    resolve: {
      webinar: webinarDetailResolver
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WebinarRoutingModule { }
