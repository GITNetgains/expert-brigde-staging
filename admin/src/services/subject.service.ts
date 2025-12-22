import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})

export class SubjectService {
  constructor(private http: HttpClient) {}

  create(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/subjects`, data);
  }

  search(params: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/subjects`, { params });
  }

  findOne(id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/subjects/${id}`);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/subjects/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/subjects/${id}`);
  }
}


