import { NgModule, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RefundRoutingModule } from './refund.routing';
import { TranslateModule } from '@ngx-translate/core';
import {
  ListingRequestComponent,
  DetailRefundRequestComponent
} from './components';
import { StatusComponent } from 'src/app/components/uis/status.component';
import { SortComponent } from 'src/app/components/uis/sort/sort.component';
import { SharedModule } from 'src/app/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RefundRoutingModule,
    NgbModule,
    SharedModule,
    TranslateModule.forChild(),
    forwardRef(() => StatusComponent),
    forwardRef(() => SortComponent)
  ],
  declarations: [ListingRequestComponent, DetailRefundRequestComponent],
  providers: [],
  exports: []
})
export class RefundModule {}
