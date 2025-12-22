import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class CourseService extends APIRequest {
  create(params: any): Promise<any> {
    return this.post('/courses', params);
  }

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/courses', params));
  }

  findOne(id: string): Promise<any> {
    return this.get(`/courses/${id}`);
  }

  update(id: string, data: any): Promise<any> {
    return this.put(`/courses/${id}`, data)
  }

  delete(id: string): Promise<any> {
    return this.del(`/courses/${id}`);
  }

  enroll(params: any): Promise<any> {
    return this.post('/enroll', params);
  }

  gift(params: any): Promise<any> {
    return this.post('/gift', params);
  }

  checkUsedCoupon(id: string): Promise<any> {
    return this.get(`/coupons/check-used-coupon/${id}`);
  }

  applyCoupon(params: any): Promise<any> {
    return this.get(this.buildUrl('/coupon/apply-coupon', params));
  }

  getTransactions(tutorId: string, params: any): Promise<any> {
    return this.get(this.buildUrl(`/courses/${tutorId}/transaction`, params));
  }

  getEnrolledList(id: string): Promise<any> {
    return this.get(`/courses/${id}/enrolled`);
  }

  saveAsDraff(params: any): Promise<any> {
    return this.post('/courses/save-as-draff', params);
  }
}
