import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class WebinarService extends APIRequest {

  create(params: any): Promise<any> {
    return this.post('/webinars', params);
  }

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/webinars', params));
  }

  findOne(id: string): Promise<any> {
    return this.get(`/webinars/${id}`);
  }

  update(id: string, data: Record<string, any>): Promise<any> {
    return this.put(`/webinars/${id}`, data);
  }

  delete(id: string): Promise<any> {
    return this.del(`/webinars/${id}`);
  }

  checkUsedCoupon(params: any): Promise<any> {
    return this.post('/coupons/check-used-coupon', params);
  }

  findSingleCoupon(id: string, params: Record<string, any>): Promise<any> {
    return this.get(this.buildUrl(`/coupons/${id}`, params));
  }

  changeStatus(id: string): Promise<any> {
    return this.put(`/webinar/${id}/change-status`);
  }

  getLatest(id: string): Promise<any> {
    return this.get(`/webinars/${id}/latest`);
  }

  removeDocument(id: string, documentId: string): Promise<any> {
    return this.del(`/webinars/${id}/remove-document/${documentId}`)
  }

  checkOverlapWebinar(data: any): Promise<any> {
    return this.post('/webinars/check/overlap', data);
  }

  enroll(params: any): Promise<any> {
    return this.post('/enroll', params);
  }

  getEnrolledList(id: string): Promise<any> {
    return this.get(`/webinars/${id}/enrolled`);
  }
}
