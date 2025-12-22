import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root',
})
export class EarningStatsService {
  constructor(private http: HttpClient) {}
  search(params: any): Observable<any> {
    return this.http.get(`${environment.apiUrl}/admin/payout/requests/stats`, {
      params,
    });
  }
  findOne(id: string): Observable<any> {
    return this.http.get(
      `${environment.apiUrl}/admin/payout/requests/stats/${id}`
    );
  }
  export(type: string, params: any): Observable<Blob> {
    const options = {
      responseType: 'blob' as 'blob',
      observe: 'body' as const,
      params: new HttpParams({ fromObject: params }),
    };

    return this.http.get(
      `${environment.apiUrl}/admin/earnings/export/${type}`,
      options
    );
  }
}
