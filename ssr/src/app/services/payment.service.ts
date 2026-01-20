import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({ providedIn: 'root' })
export class PaymentService extends APIRequest {

  enroll(params: any): Promise<any> {
    return this.post('/enroll', params);
  }

  createRazorpayOrder(data: {
    transactionId: string;
    amount: number;
  }): Promise<any> {
    return this.post('/payment/razorpay/order', data);
  }

  confirmRazorpay(data: {
    transactionId: string;
    razorpayPaymentId: string;
  }): Promise<any> {
    return this.post('/payment/razorpay/confirm', data);
  }
}
