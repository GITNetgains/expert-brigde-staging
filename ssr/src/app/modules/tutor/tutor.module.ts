import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared.module';
import { TutorListComponent } from './list/tutor-list.component';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { TutorCardComponent } from 'src/app/components/tutor/tutor-card/tutor-card.component';
import { CertificateComponent } from 'src/app/components/tutor/certificate/certificate.component';
import { CardTextComponent } from 'src/app/components/uis/card-text.component';
import { TutorProfileComponent } from './details/profile.component';
import { ReviewListComponent } from 'src/app/components/review/review-list/list.component';
import { ShareIconsModule } from 'ngx-sharebuttons/icons';
import { ShareButtonModule } from 'ngx-sharebuttons/button';
import { TutorRoutingModule } from './tutor.routing';
import { ConfirmModalComponent } from 'src/app/components/booking/confirm/confirm.component';
import { BookingComponent } from './booking/booking.component';
import { ApplyCouponComponent } from 'src/app/components/coupon/apply-coupon/apply.component';
import { UserAvailableTimeComponent } from 'src/app/components/calendar/tutor-available-time/tutor-available-time.component';
import { PageModule } from '../page/page.module';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule.forChild(),
    SharedModule,
    NgbPaginationModule,
    FormsModule,
    CertificateComponent,
    CardTextComponent,
    ReviewListComponent,
    ShareIconsModule,
    ShareButtonModule,
    TutorRoutingModule,
        PageModule,
    ApplyCouponComponent,
    UserAvailableTimeComponent,

 
  ],
  declarations: [
    TutorListComponent,
    TutorCardComponent,
    TutorProfileComponent,
    ConfirmModalComponent,
    BookingComponent
    
  ],
  exports: []
})
export class TutorModule { }
