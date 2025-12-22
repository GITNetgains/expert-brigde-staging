import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class ReviewService extends APIRequest {
  create(data: any): Promise<any> {
    return this.post('/reviews', data);
  }

  list(params: any): Promise<any> {
    return this.get(this.buildUrl('/reviews', params));
  }
  findOne(id: string): Promise<any> {
    return this.get(`/reviews/${id}`);
  }

  current(itemId: any, params: any): Promise<any> {
    return this.get(this.buildUrl(`/reviews/${itemId}/current`, params));
  }

  update(id: string, data: any): Promise<any> {
    return this.put(`/reviews/${id}`, data);
  }

  delete(id: string): Promise<any> {
    return this.del(`/reviews/${id}`);
  }

  findByRateToAndRateBy(query: any): Promise<any> {
    return this.get(this.buildUrl('/reviews/findOne', query));
  }
}
