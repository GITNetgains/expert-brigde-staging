import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GradeService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/grades`);
  }
  delete(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/grades/${id}`);
  }
  findById(id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/grades/${id}`);
  }
  update(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/grades/${id}`, data);
  }
  create(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/grades`, data);
  }
  search(params: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/grades`, { params });
  }
}
