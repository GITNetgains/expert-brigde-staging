import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private postUrl = `${environment.apiUrl}/posts`;

  constructor(private http: HttpClient) {}

  create(credentials: any): Observable<any> {
    return this.http.post(this.postUrl, credentials);
  }

  search(params: any): Observable<any> {
    let httpParams = new HttpParams();
    for (let key in params) {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key]);
      }
    }
    return this.http.get(this.postUrl, { params: httpParams });
  }

  findOne(id: string | number): Observable<any> {
    return this.http.get(`${this.postUrl}/${id}`);
  }

  update(id: string | number, data: any): Observable<any> {
    return this.http.put(`${this.postUrl}/${id}`, data);
  }

  delete(id: string | number): Observable<any> {
    return this.http.delete(`${this.postUrl}/${id}`);
  }
}
