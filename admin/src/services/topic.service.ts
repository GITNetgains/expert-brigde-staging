import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})

export class TopicService {
  constructor(private http: HttpClient) {}

  create(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/topics`, data);
  }

  search(params: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/topics`, { params });
  }

  findOne(id: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/topics/${id}`);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/topics/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/topics/${id}`);
  }
}
