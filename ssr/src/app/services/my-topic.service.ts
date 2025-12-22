import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class MyTopicService extends APIRequest {
  create(params: any): Promise<any> {
    return this.post('/my-topic', params);
  }

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/my-topics', params));
  }

  findOne(id: string): Promise<any> {
    return this.get(`/my-topic/${id}`);
  }

  update(id: string, data: any): Promise<any> {
    return this.put(`/my-topic/${id}`, data);
  }

  delete(id: string): Promise<any> {
    return this.del(`/my-topic/${id}`);
  }

  getListOfMe(params: any): Promise<any> {
    return this.get(this.buildUrl('/my-topics/me', params));
  }

  changeStatus(id: string): Promise<any> {
    return this.put(`/my-topic/${id}/change-status`);
  }
}
