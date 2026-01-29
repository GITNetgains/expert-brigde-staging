import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class ContactService extends APIRequest {

  /**
   * Submit Contact Us form
   */
  submit(data: any): Promise<any> {
    return this.post('/contact-us', data);
  }
}
