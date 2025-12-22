import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TutorService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  create(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tutors`, data);
  }

  search(params: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/tutors`, { params });
  }

  findOne(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/tutors/${id}`);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/tutors/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tutors/${id}`);
  }

  me(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tutors/me`);
  }

  approve(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/tutors/${id}/approve`, {});
  }

  reject(id: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tutors/${id}/reject`, data);
  }

  getSkills(params: any = {}): Observable<any> {
    return this.http.get(`${this.apiUrl}/skills`, { params });
  }

  createCertificate(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/certificates`, data);
  }

  updateCertificate(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/certificates/${id}`, data);
  }

  deleteCertificate(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/certificates/${id}`);
  }

  changeStatus(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/tutors/${id}/change-status`, {});
  }

  getTutorSubjects(params: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-subjects`, { params });
  }

  inviteZoom(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/zoomus/create-user/${email}`, {});
  }
}
