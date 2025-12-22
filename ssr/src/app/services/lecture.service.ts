import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class LectureService extends APIRequest {
  create(params: any): Promise<any> {
    return this.post('/lectures', params);
  }

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/lectures', params));
  }

  findOne(id: string): Promise<any> {
    return this.get(`/lectures/${id}`);
  }

  update(id: string, data: any): Promise<any> {
    return this.get(`/lectures/${id}`, data);
  }

  delete(id: string): Promise<any> {
    return this.del(`/lectures/${id}`);
  }
}
