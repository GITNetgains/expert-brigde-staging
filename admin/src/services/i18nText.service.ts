import { HttpClient, HttpParams } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TextService {
  constructor(private http: HttpClient) {}
  create(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/i18n/text`, data);
  }
  update(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/i18n/text/${id}`, data);
  }
  search(params: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/i18n/text/`, {
      params: params, 
    });
  }
  remove(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/i18n/text/${id}`);
  }
}
