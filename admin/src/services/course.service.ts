import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Course {
  id: number;
  name: string;
  description: string;
  // Add other course properties as needed
}

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  search(params: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/courses`, { params });
  }

  create(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses`, data);
  }

  findOne(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/courses/${id}`);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/courses/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/courses/${id}`);
  }

  approve(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses/${id}/approve`, {});
  }

  reject(id: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses/${id}/reject`, data);
  }

  disable(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses/${id}/disable`, {});
  }

  enable(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses/${id}/enable`, {});
  }

  saveAsDraff(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses/save-as-draff`, data);
  }
}
