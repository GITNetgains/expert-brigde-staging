import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared.module';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { CardWebinarComponent } from 'src/app/components/webinar/card-webinar/card-webinar.component';
import { WebinarListingComponent } from './list/list.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { WebinarRoutingModule } from './webinar.routing';
import { DetailWebinarComponent } from './details/detail.component';
import { CardTextComponent } from 'src/app/components/uis/card-text.component';
import { ReviewListComponent } from 'src/app/components/review/review-list/list.component';
import { ApplyCouponComponent } from 'src/app/components/coupon/apply-coupon/apply.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule.forChild(),
    SharedModule,
    NgbPaginationModule,
    FormsModule,
    CardWebinarComponent,
    NgSelectModule,
    WebinarRoutingModule,
    CardTextComponent,
    ReviewListComponent,
    ApplyCouponComponent
  ],
  declarations: [WebinarListingComponent, DetailWebinarComponent],
  exports: [CardWebinarComponent]
})
export class WebinarModule {}
