import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TestimonialService {
  private testimonialsUrl = `${environment.apiUrl}/testimonials`;

  constructor(private http: HttpClient) {}

  create(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.testimonialsUrl}`, credentials);
  }

  search(params: any): Observable<any> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get<any>(`${this.testimonialsUrl}`, {
      params: httpParams,
    });
  }

  findOne(id: string): Observable<any> {
    return this.http.get<any>(`${this.testimonialsUrl}/${id}`);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.testimonialsUrl}/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.testimonialsUrl}/${id}`);
  }
}
