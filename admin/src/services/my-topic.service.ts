import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MyTopicService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  create(params: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/my-topic`, params);
  }

  search(params: any): Observable<any> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get(`${this.apiUrl}/my-topics`, { params: httpParams });
  }

  findOne(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-topic/${id}`);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/my-topic/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/my-topic/${id}`);
  }

  getListOfMe(params: any): Observable<any> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get(`${this.apiUrl}/my-topics/me`, { params: httpParams });
  }

  changeStatus(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/my-topic/${id}/change-status`, {});
  }
}
