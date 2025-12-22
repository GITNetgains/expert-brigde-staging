import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class MyCategoryService extends APIRequest {
  create(params: any): Promise<any> {
    return this.post('/my-category', params);
  }

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/my-categories', params));
  }

  findOne(id: string): Promise<any> {
    return this.get(`/my-category/${id}`);
  }

  update(id: string, data: any): Promise<any> {
    return this.put(`/my-category/${id}`, data);
  }

  delete(id: string): Promise<any> {
    return this.del(`/my-category/${id}`);
  }

  getListOfMe(params: any): Promise<any> {
    return this.get(this.buildUrl('/my-categories/me', params));
  }

  changeStatus(id: string): Promise<any> {
    return this.put(`/my-category/${id}/change-status`);
  }
}
