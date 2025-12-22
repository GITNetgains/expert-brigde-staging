import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';
@Injectable({
  providedIn: 'root'
})
export class SectionService extends APIRequest {
  create(params: any): Promise<any> {
    return this.post('/sections', params);
  }

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/sections', params));
  }

  findOne(id: string): Promise<any> {
    return this.get(`/sections/${id}`);
  }

  update(id: string, data: any): Promise<any> {
    return this.put(`/sections/${id}`, data);
  }

  delete(id: string): Promise<any> {
    return this.del(`/sections/${id}`);
  }
}
