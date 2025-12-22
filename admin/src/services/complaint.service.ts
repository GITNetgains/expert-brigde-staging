import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private earningUrl = `${environment.apiUrl}/earnings`;

  constructor(private http: HttpClient) {}
  search(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key]);
      }
    });

    return this.http.get(`${environment.apiUrl}/reports`, {
      params: httpParams,
    });
  }

  findOne(id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/reports/${id}`);
  }
  remove(id: any): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/reports`, id);
  }
}
