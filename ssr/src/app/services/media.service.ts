import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class MediaService extends APIRequest {

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/media/search', params));
  }

  upload(base64: string, options: any): Promise<any> {
    return this.post('/media/photos', { ...options, base64 });
  }

  update(id: string, params: any): Promise<any> {
    return this.put(`/media/${id}`, params);
  }

  remove(id: string): Promise<any> {
    return this.del(`/media/${id}`);

  }
}
