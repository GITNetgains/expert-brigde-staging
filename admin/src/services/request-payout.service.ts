import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RequestPayoutService {
  private payoutUrl = `${environment.apiUrl}/payout`;

  constructor(private http: HttpClient) {}

  getBalance(): Observable<any> {
    return this.http.get(`${this.payoutUrl}/balance`);
  }

  search(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });
    return this.http.get(`${this.payoutUrl}/requests`, { params: httpParams });
  }

  create(data: any): Observable<any> {
    return this.http.post(`${this.payoutUrl}/request`, data);
  }

  reject(id: string | number, data: any): Observable<any> {
    return this.http.post(`${this.payoutUrl}/request/${id}/reject`, data);
  }

  approve(id: string | number, data: any): Observable<any> {
    return this.http.post(`${this.payoutUrl}/request/${id}/approve`, data);
  }

  findOne(id: string | number): Observable<any> {
    return this.http.get(`${this.payoutUrl}/requests/${id}`);
  }

  stats(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });
    return this.http.get(`${this.payoutUrl}/stats`, { params: httpParams });
  }

  export(type: string, params: any): void {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });

    this.http
      .get(`${environment.apiUrl}/admin/payout-requests/export/${type}`, {
        params: httpParams,
        responseType: 'blob',
      })
      .subscribe((blob) => {
        let extension = 'txt';
        if (type === 'excel') {
          extension = 'xlsx';
        } else if (type === 'csv') {
          extension = 'csv';
        }

        saveAs(blob, `payout-requests.${extension}`);
      });
  }
}
