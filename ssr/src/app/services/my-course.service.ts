import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class MyCourseService extends APIRequest {

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/my-courses', params));
  }

  findOne(id: string): Promise<any> {
    return this.get(`/my-courses/${id}`);
  }

  getSections(id: string): Promise<any> {
    return this.get(`/my-courses/${id}/sections`);
  }

  updateProgress(id: string, params: any): Promise<any> {
    return this.put(`/my-courses/${id}/update-progress`, params);
  }

  complete(id: string): Promise<any> {
    return this.put(`/my-courses/${id}/complete`);
  }
}
