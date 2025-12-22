import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CouponService {
  constructor(private http: HttpClient) {}

  create(params: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/coupons`, params);
  }
  search(params: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/coupons`, { params });
  }
  findOne(id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/coupons/${id}`);
  }

  update(id: string, params: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/coupons/${id}`, params);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/coupons/${id}`);
  }
  getCurrentCoupon(params: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/coupon/current`, { params });
  }
}
