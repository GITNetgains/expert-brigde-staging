import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class TestimonialService extends APIRequest {

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/testimonials', params));
  }
}
