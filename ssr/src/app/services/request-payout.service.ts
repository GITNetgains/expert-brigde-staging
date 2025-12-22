import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class RequestPayoutService extends APIRequest {

  getBalance(params: any): Promise<any> {
    return this.get(this.buildUrl('/payout/balance', params));
  }

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/payout/requests', params));
  }

  create(data: any): Promise<any> {
    return this.post('/payout/requests', data);
  }

  stats(params: any): Promise<any> {
    return this.get(this.buildUrl('/payout/stats', params));
  }

  findAccount(params: any): Promise<any> {
    return this.get(this.buildUrl('/payout/accounts', params));
  }
}
