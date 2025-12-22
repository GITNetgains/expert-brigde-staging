import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private configUrl = `${environment.apiUrl}/system/configs`;

  constructor(private http: HttpClient) {}

  list(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params || {}).forEach((key) => {
      httpParams = httpParams.set(key, params[key]);
    });

    return this.http.get(this.configUrl, { params: httpParams });
  }

  update(id: string | number, value: any): Observable<any> {
    return this.http.put(`${this.configUrl}/${id}`, { value });
  }
}
