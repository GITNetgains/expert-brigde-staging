import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TemplateService {
  private emailTemplateUrl = `${environment.apiUrl}/email-templates`;

  constructor(private http: HttpClient) {}

  create(params: any): Observable<any> {
    return this.http.post(this.emailTemplateUrl, params);
  }

  search(params: any): Observable<any> {
    return this.http.get(this.emailTemplateUrl, { params });
  }

  findOne(id: string): Observable<any> {
    return this.http.get(`${this.emailTemplateUrl}/${id}`);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put(`${this.emailTemplateUrl}/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.emailTemplateUrl}/${id}`);
  }
}
