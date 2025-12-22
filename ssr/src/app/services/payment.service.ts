import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class PaymentService extends APIRequest {
  enroll(params: any): Promise<any> {
    return this.post('/enroll', params);
  }
}
