import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';


@Injectable({
  providedIn: 'root'
})
export class RequestRefundService extends APIRequest {

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/refund/requests', params));
  }

  create(data: any): Promise<any> {
    return this.post('/refund/request', data);
  }

  findOne(id: string): Promise<any> {
    return this.get(`/refund/requests/${id}`);
  }
}
