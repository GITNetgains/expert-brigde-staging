import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class LectureMediaService extends APIRequest {
  create(params: any): Promise<any> {
    return this.post('/lecture-medias', params);
  }

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/lecture-medias', params));
  }

  findOne(id: string): Promise<any> {
    return this.get(`/lecture-medias/${id}`);
  }

  update(id: string, data: any): Promise<any> {
    return this.put(`/lecture-medias/${id}`, data);
  }

  delete(id: string): Promise<any> {
    return this.del(`/lecture-medias/${id}`);
  }
}
