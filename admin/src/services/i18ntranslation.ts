import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private baseUrl = `${environment.apiUrl}/i18n/translations`;

  constructor(private http: HttpClient) {}

  create(data: any): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  search(params: any): Observable<any> {
    return this.http.get(`${this.baseUrl}`, { params });
  }

  remove(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  pull(lang: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${lang}/pull`, {});
  }
}
