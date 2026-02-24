import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
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

  /**
   * Fetches all configs and returns a key-value map (e.g. { currencySymbol: '₹' }).
   * Used by the app config resolver so admin views show the correct currency.
   */
  getAppConfig(): Observable<Record<string, unknown>> {
    return this.http.get<{ data: { items?: { key: string; value: unknown }[]; configs?: { items?: { key: string; value: unknown }[] } } }>(this.configUrl).pipe(
      map((resp) => {
        const items = resp?.data?.items ?? resp?.data?.configs?.items ?? [];
        return items.reduce<Record<string, unknown>>((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});
      }),
      catchError(() => of({}))
    );
  }

  update(id: string | number, value: any): Observable<any> {
    return this.http.put(`${this.configUrl}/${id}`, { value });
  }
}
