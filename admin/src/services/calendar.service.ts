import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { IResponse, ISchedule } from 'src/interfaces';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  constructor(private http: HttpClient) {}

  search(
    params: Record<string, any>
  ): Observable<IResponse<{ items: ISchedule[]; count: number }>> {
    return this.http.get<IResponse<{ items: ISchedule[]; count: number }>>(
      `${environment.apiUrl}/schedule`,
      { params }
    );
  }

  create(payload: Record<string, any>): Observable<IResponse<ISchedule>> {
    return this.http.post<IResponse<ISchedule>>(
      `${environment.apiUrl}/schedule`,
      payload
    );
  }

  update(
    id: string,
    payload: Record<string, any>
  ): Observable<IResponse<ISchedule>> {
    return this.http.put<IResponse<ISchedule>>(
      `${environment.apiUrl}/schedule/${id}`,
      payload
    );
  }

  remove(id: string): Observable<IResponse<{ success: boolean }>> {
    return this.http.delete<IResponse<{ success: boolean }>>(
      `${environment.apiUrl}/schedule/${id}`
    );
  }

  checkByHash(hash: string): Observable<IResponse<any>> {
    return this.http.post<IResponse<any>>(
      `${environment.apiUrl}/schedule/check-by-hash/${hash}`,
      {}
    );
  }
  checkByWebinar(webinarId: string): Observable<IResponse<any>> {
    return this.http.post<IResponse<any>>(
      `${environment.apiUrl}/schedule/check-by-webinar/${webinarId}`,
      {}
    );
  }
  deleteByHash(hash: string): Observable<IResponse<{ success: boolean }>> {
    return this.http.delete<IResponse<{ success: boolean }>>(
      `${environment.apiUrl}/schedule/remove-by-hash/${hash}`
    );
  }
}
