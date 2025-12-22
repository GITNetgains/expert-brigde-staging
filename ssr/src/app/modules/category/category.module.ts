import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { WebinarModule } from '../webinar/webinar.module';
import { NgxStripeModule } from 'ngx-stripe';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { CategoriesComponent } from './category.component';
import {
  CategoryService,
  TutorService,
  WebinarService
} from 'src/app/services';
import { CategoriesRoutingModule } from './category.routing';
import { CourseModule } from '../course/course.module';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    TranslateModule.forChild(),
    NgxStripeModule.forRoot(),
    CategoriesRoutingModule,
    WebinarModule,
    SlickCarouselModule,
    CourseModule
  ],
  declarations: [CategoriesComponent],
  providers: [WebinarService, CategoryService, TutorService],
  exports: []
})
export class CategoryModule {}
