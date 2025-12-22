import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared.module';
import {
  NgbPaginationModule,
  NgbProgressbarModule,
  NgbTooltipModule
} from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { CourseListComponent } from './list/list.component';
import { CardCourseComponent } from 'src/app/components/course/card-course/card-course.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { MediaModalComponent } from 'src/app/components/media/media-modal/media-modal.component';
import { CourseDetailComponent } from './details/detail.component';
import { LectureModalComponent } from 'src/app/components/course/lecture-modal/lecture-modal.component';
import { CardTextComponent } from 'src/app/components/uis/card-text.component';
import { ReviewListComponent } from 'src/app/components/review/review-list/list.component';
import { CourseRoutingModule } from './course.routing';
import { ApplyCouponComponent } from 'src/app/components/coupon/apply-coupon/apply.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule.forChild(),
    SharedModule,
    NgbPaginationModule,
    FormsModule,
    CardCourseComponent,
    NgSelectModule,
    MediaModalComponent,
    LectureModalComponent,
    NgbProgressbarModule,
    NgbTooltipModule,
    CardTextComponent,
    ReviewListComponent,
    CourseRoutingModule,
    ApplyCouponComponent
  ],
  declarations: [CourseListComponent, CourseDetailComponent],
  exports: [CardCourseComponent]
})
export class CourseModule {}
