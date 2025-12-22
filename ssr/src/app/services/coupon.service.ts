import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({ providedIn: 'root' })
export class CouponService extends APIRequest {

  create(params: any): Promise<any> {
    return this.post('/coupons', params);
  }

  search(params: any): Promise<any> {
    return this.get(this.buildUrl('/coupons', params));
  }

  findOne(id: string): Promise<any> {
    return this.get(`/coupons/${id}`);
  }

  update(id: string, data: any): Promise<any> {
    return this.put(`/coupons/${id}`, data);
  }

  delete(id: string): Promise<any> {
    return this.del(`/coupons/${id}`);
  }

  getCurrentCoupon(params: any): Promise<any> {
    return this.get(this.buildUrl('/coupon/current', params));
  }

  checkUsedCoupon(id: string): Promise<any> {
    return this.get(`/coupons/check-used-coupon/${id}`);
  }

  applyCoupon(params: any): Promise<any> {
    return this.post('/coupon/apply-coupon', params);
  }

  checkBooked(webinarId: String): Promise<any> {
    return this.post(`/enroll/${webinarId}/booked`);
  }
}
