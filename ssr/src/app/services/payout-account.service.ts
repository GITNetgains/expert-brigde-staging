import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class AccountService extends APIRequest {

  find(params: any): Promise<any> {
    return this.get(this.buildUrl('/payout/accounts', params));
  }

  create(data: any): Promise<any> {
    return this.post('/payout/accounts', data);
  }

  remove(id: string): Promise<any> {
    return this.del(`/payout/accounts/${id}`);
  }

  findOne(id: string): Promise<any> {
    return this.get(`/payout/accounts/${id}`);
  }

  update(id: string, data: any): Promise<any> {
    return this.put(`/payout/accounts/${id}`, data);
  }
}
