import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebinarService {
  constructor(private http: HttpClient) {}

  search(params: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/webinars`, { params });
  }
  create(params: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/webinars`, params);
  }
  findOne(id: string | null): Observable<any> {
    return this.http.get(`${environment.apiUrl}/webinars/${id}`);
  }
  update(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/webinars/${id}`, data);
  }
  delete(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/webinars/${id}`);
  }
  changeStatus(id: string): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/webinar/${id}/change-status`,
      {}
    );
  }

  removeDocument(id: string, documentId: string): Observable<any> {
    return this.http.delete(
      `${environment.apiUrl}/webinars/${id}/remove-document/${documentId}`
    );
  }
}
