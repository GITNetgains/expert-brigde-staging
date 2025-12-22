import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private appointmentUrl = `${environment.apiUrl}/appointments`;

  constructor(private http: HttpClient) {}

  create(credentials: any): Observable<any> {
    return this.http.post(this.appointmentUrl, credentials);
  }

  cancel(id: string, data: any): Observable<any> {
    return this.http.post(`${this.appointmentUrl}/${id}/cancel`, data);
  }

  search(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params || {}).forEach((key) => {
      httpParams = httpParams.set(key, params[key]);
    });

    return this.http.get(this.appointmentUrl, { params: httpParams });
  }

  findOne(id: string): Observable<any> {
    return this.http.get(`${this.appointmentUrl}/${id}`);
  }

  update(id: string, data: any): Observable<any> {
    return this.http.put(`${this.appointmentUrl}/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.appointmentUrl}/${id}`);
  }
}
