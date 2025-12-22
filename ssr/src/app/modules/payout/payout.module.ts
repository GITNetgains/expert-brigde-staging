import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PayoutRoutingModule } from './payout.routing';

import {
  ListingRequestComponent,
  ListingAccountsComponent,
  CreateRequestPayoutComponent,
  AccountUpdateComponent,
  AccountCreateComponent,
  PayoutMenuComponent
} from './components';
import { TranslateModule } from '@ngx-translate/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { RequestPayoutModalComponent } from './components/modal-request/modal-request.component';
import { SharedModule } from 'src/app/shared.module';
import { SortComponent } from 'src/app/components/uis/sort/sort.component';
import { StatusComponent } from 'src/app/components/uis/status.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    PayoutRoutingModule,
    NgbModule,
    SharedModule,
    TranslateModule.forChild(),
    NgxChartsModule,
    SortComponent,
    StatusComponent
  ],
  declarations: [
    ListingAccountsComponent,
    ListingRequestComponent,
    AccountUpdateComponent,
    CreateRequestPayoutComponent,
    AccountCreateComponent,
    PayoutMenuComponent,
    RequestPayoutModalComponent
  ],
  exports: []
})
export class PayoutModule { }
