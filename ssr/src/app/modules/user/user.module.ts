import { NgModule, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared.module';
import { NgbDatepickerModule, NgbDropdownModule, NgbNavModule, NgbPaginationModule, NgbPopoverModule, NgbProgressbarModule, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { CertificateComponent } from 'src/app/components/tutor/certificate/certificate.component';
import { CardTextComponent } from 'src/app/components/uis/card-text.component';
import { ReviewListComponent } from 'src/app/components/review/review-list/list.component';
import { ShareIconsModule } from 'ngx-sharebuttons/icons';
import { ShareButtonModule } from 'ngx-sharebuttons/button';
import { ProfileUpdateComponent } from './profile/profile-update.component';
import { UserRoutingModule } from './user.routing';
import { TimezoneComponent } from 'src/app/components/uis/timezone.component';
import { QuillModule } from 'ngx-quill';
import { AvatarUploadComponent } from 'src/app/components/media/avatar-upload/avatar-upload.component';
import { MyCertificateComponent } from 'src/app/components/user/my-certificate-modal/my-certificate.component';
import { AddCetificationComponent } from 'src/app/components/tutor/certificate/add-certification/add-certification.component';
import { FileUploadComponent } from 'src/app/components/media/file-upload/file-upload.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MyCategoriesComponent, MyCategoryFormComponent, MySubjectFormComponent, MyTopicFormComponent } from './my-category';
import { SortComponent } from 'src/app/components/uis/sort/sort.component';
import { ScheduleEditComponent } from 'src/app/components/calendar/schedule/schedule.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { ListRecurringScheduleComponent } from './schedule/recurring-schedule/list-recurring.component';
import { RecurringFormComponent } from './schedule/recurring-schedule/modal-recurring/modal-recurring.component';
import { CouponComponent } from 'src/app/components/coupon/coupon-form/coupon.component';
import { ListNotificationComponent } from './notifications/list.component';
import { MediaModalComponent } from 'src/app/components/media/media-modal/media-modal.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { ListMyCourseComponent } from './my-course/list/list.component';
import { MyCourseDetailComponent } from './my-course/detail/detail.component';
import { CouponListComponent } from './coupon/list/list.component';
import { CouponFormComponent } from './coupon/form/form.component';
import {
  CourseListingComponent,
  CourseCreateComponent,
  CourseUpdateComponent,
  CourseCouponComponent,
  CourseGoalComponent,
  CourseLetureComponent,
  LectureFormComponent,
  SectionFormComponent
} from './course';
import {
  WebinarListingComponent,
  WebinarCreateComponent,
  WebinarUpdateComponent,
  ParticipantFormComponent
} from './webinar';
import { FavoriteComponent } from './favorite/favorite.component';
import { TutorCardFavoriteComponent } from 'src/app/components/tutor/tutor-card/tutor-card-favorite.component';
import { CardWebinarComponent } from 'src/app/components/webinar/card-webinar/card-webinar.component';
import { CardCourseComponent } from 'src/app/components/course/card-course/card-course.component';
import { ReportFormComponent } from 'src/app/components/appointment/report-form/report-form.component';
import { ModalAppointmentComponent } from './modal-appointment/modal-appointment.component';
import { LessonDetailComponent } from './my-lesson/detail/detail.component';
import { ListLessonComponent } from './my-lesson/list/list.component';
import { ScheduleDetailComponent } from './my-schedule/detail/detail.component';
import { ListScheduleComponent } from './my-schedule/list/list.component';
import { AppointmentStatusComponent } from 'src/app/components/appointment/appointment-status.component';
import { LoadingComponent } from 'src/app/components/uis/loading.component';
import { UserAvailableTimeComponent } from 'src/app/components/calendar/tutor-available-time/tutor-available-time.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule.forChild(),
    NgbPaginationModule,
    FormsModule,
    ShareIconsModule,
    ShareButtonModule,
    UserRoutingModule,
    NgbNavModule,
    QuillModule.forRoot(),
    NgbPopoverModule,
    NgbTimepickerModule,
    NgbDatepickerModule,
    NgxExtendedPdfViewerModule,
    NgbProgressbarModule,
    NgbDropdownModule,
    NgbPopoverModule,
    forwardRef(() => SharedModule),
    forwardRef(() => CardWebinarComponent),
    forwardRef(() => CardCourseComponent),
    forwardRef(() => ScheduleEditComponent),
    forwardRef(() => FileUploadComponent),
    forwardRef(() => AvatarUploadComponent),
    forwardRef(() => SortComponent),
    forwardRef(() => TimezoneComponent),
    forwardRef(() => AppointmentStatusComponent),
    forwardRef(() => LoadingComponent),
    forwardRef(() => UserAvailableTimeComponent),
    forwardRef(() => CertificateComponent),
    forwardRef(() => ReviewListComponent),
    forwardRef(() => CardTextComponent),
    forwardRef(() => MediaModalComponent),
    forwardRef(() => CouponComponent)

  ],
  declarations: [
    ProfileUpdateComponent,
    MyCertificateComponent,
    AddCetificationComponent,
    DashboardComponent,
    MyCategoriesComponent,
    MyCategoryFormComponent,
    MySubjectFormComponent,
    MyTopicFormComponent,
    ScheduleComponent,
    ListRecurringScheduleComponent,
    RecurringFormComponent,
    ListNotificationComponent,
    ListMyCourseComponent,
    MyCourseDetailComponent,
    CouponListComponent,
    CouponFormComponent,
    CourseListingComponent,
    CourseCreateComponent,
    CourseUpdateComponent,
    CourseCouponComponent,
    CourseGoalComponent,
    CourseLetureComponent,
    LectureFormComponent,
    SectionFormComponent,
    WebinarListingComponent,
    WebinarCreateComponent,
    WebinarUpdateComponent,
    ParticipantFormComponent,
    FavoriteComponent,
    TutorCardFavoriteComponent,
    ListScheduleComponent,
    ScheduleDetailComponent,
    ListLessonComponent,
    LessonDetailComponent,
    ModalAppointmentComponent,
    ReportFormComponent
  ],
  exports: []
})
export class UserModule { }
