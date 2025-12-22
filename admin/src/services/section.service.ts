import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SectionService {
  constructor(private http: HttpClient) {}

  create(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/sections`, data);
  }

  search(params: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/sections`, { params });
  }

  findOne(id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/sections/${id}`);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/sections/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/sections/${id}`);
  }
}
