import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class MySubjectService extends APIRequest {
  create(params: any): Promise<any> {
    return this.post('/my-subject', params);
  }

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/my-subjects', params));
  }

  findOne(id: string): Promise<any> {
    return this.get(`/my-subject/${id}`);
  }

  update(id: string, data: any): Promise<any> {
    return this.put(`/my-subject/${id}`, data);
  }

  delete(id: string): Promise<any> {
    return this.del(`/my-subject/${id}`);
  }

  getListOfMe(params: any): Promise<any> {
    return this.get(this.buildUrl('/my-subjects/me', params));
  }

  changeStatus(id: string): Promise<any> {
    return this.put(`/my-subject/${id}/change-status`);
  }
}
