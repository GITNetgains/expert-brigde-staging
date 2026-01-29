import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private baseUrl = `${environment.apiUrl}/contact-us`;

  constructor(private http: HttpClient) {}

  search(params: any): Observable<any> {
    let httpParams = new HttpParams();
    for (const key in params) {
      const val = params[key];
      if (val !== null && val !== undefined && val !== '') {
        httpParams = httpParams.set(key, val);
      }
    }
    return this.http.get(this.baseUrl, { params: httpParams });
  }

  findOne(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
