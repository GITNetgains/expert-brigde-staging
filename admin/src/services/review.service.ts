import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  findOne(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/reviews/${id}`);
  }

  current(type: string, itemId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/reviews/${type}/${itemId}/current`);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/reviews/${id}`, data);
  }

  list(params: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/reviews`, { params });
  }

  remove(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reviews/${id}`);
  }
}
