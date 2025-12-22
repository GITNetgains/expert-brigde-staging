import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  private mediaUrl = `${environment.apiUrl}/media`;

  constructor(private http: HttpClient) {}

  search(params: any): Observable<any> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get(`${this.mediaUrl}/search`, { params: httpParams });
  }

  upload(base64: string, options: any): Observable<any> {
    const body = {
      ...options,
      base64,
    };
    return this.http.post(`${this.mediaUrl}/photos`, body);
  }

  update(id: string, params: any): Observable<any> {
    return this.http.put(`${this.mediaUrl}/${id}`, params);
  }

  remove(mediaId: string): Observable<any> {
    return this.http.delete(`${this.mediaUrl}/${mediaId}`);
  }
}

