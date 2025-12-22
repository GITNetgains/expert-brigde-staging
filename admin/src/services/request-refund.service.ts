import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RequestRefundService {
  private refundUrl = `${environment.apiUrl}/refund`;

  constructor(private http: HttpClient) {}

  search(params: any): Observable<any> {
    return this.http.get(`${this.refundUrl}/requests`, { params });
  }

  create(data: any): Observable<any> {
    return this.http.post(`${this.refundUrl}/request`, data);
  }

  findOne(id: string): Observable<any> {
    return this.http.get(`${this.refundUrl}/requests/${id}`);
  }

  approve(id: string, data: any): Observable<any> {
    return this.http.post(`${this.refundUrl}/request/${id}/approve`, data);
  }

  reject(id: string, data: any): Observable<any> {
    return this.http.post(`${this.refundUrl}/request/${id}/reject`, data);
  }

  confirm(id: string): Observable<any> {
    return this.http.post(`${this.refundUrl}/request/${id}/confirm`, {});
  }
}
