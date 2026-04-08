import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { IResponse, ISchedule } from 'src/interfaces';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  constructor(private http: HttpClient) {}

  private authOptions() {
    const token = (localStorage.getItem('accessToken') || '').trim();
    if (!token) return {};
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  search(
    params: Record<string, any>
  ): Observable<IResponse<{ items: ISchedule[]; count: number }>> {
    return this.http.get<IResponse<{ items: ISchedule[]; count: number }>>(
      `${environment.apiUrl}/schedule`,
      { params, ...this.authOptions() }
    );
  }

  create(payload: Record<string, any>): Observable<IResponse<ISchedule>> {
    return this.http.post<IResponse<ISchedule>>(
      `${environment.apiUrl}/schedule`,
      payload,
      this.authOptions()
    );
  }

  update(
    id: string,
    payload: Record<string, any>
  ): Observable<IResponse<ISchedule>> {
    return this.http.put<IResponse<ISchedule>>(
      `${environment.apiUrl}/schedule/${id}`,
      payload,
      this.authOptions()
    );
  }

  remove(id: string): Observable<IResponse<{ success: boolean }>> {
    return this.http.delete<IResponse<{ success: boolean }>>(
      `${environment.apiUrl}/schedule/${id}`,
      this.authOptions()
    );
  }

  checkByHash(hash: string): Observable<IResponse<any>> {
    return this.http.post<IResponse<any>>(
      `${environment.apiUrl}/schedule/check-by-hash/${hash}`,
      {},
      this.authOptions()
    );
  }
  checkByWebinar(webinarId: string): Observable<IResponse<any>> {
    return this.http.post<IResponse<any>>(
      `${environment.apiUrl}/schedule/check-by-webinar/${webinarId}`,
      {},
      this.authOptions()
    );
  }
  deleteByHash(hash: string): Observable<IResponse<{ success: boolean }>> {
    return this.http.delete<IResponse<{ success: boolean }>>(
      `${environment.apiUrl}/schedule/remove-by-hash/${hash}`,
      this.authOptions()
    );
  }
}
