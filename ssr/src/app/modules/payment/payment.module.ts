import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { PaymentRoutingModule } from '../payment/payment.routing';
import { PaymentSuccessComponent } from './components/success/success.component';
import { PaymentCancelComponent } from './components/cancel/cancel.component';
import { PayComponent } from './components/pay/pay.component';
import { TranslateModule } from '@ngx-translate/core';
import { NgxStripeModule } from 'ngx-stripe';
import { environment } from 'src/environments/environment';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    PaymentRoutingModule,
    NgSelectModule,
    TranslateModule.forChild(),
    NgxStripeModule.forRoot(environment.stripeKey),
    ReactiveFormsModule
  ],
  declarations: [PaymentSuccessComponent, PaymentCancelComponent, PayComponent],
  exports: [],
  entryComponents: []
})
export class PaymentModule { }
