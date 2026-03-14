import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

interface CommissionConfig {
  minCommissionPercent: number;
  defaultCommissionPercent: number;
  gstDomesticRate: number;
}

// Fallback values -- used ONLY if API call fails
// Log warning when these are used
const CONFIG_FALLBACK: CommissionConfig = {
  minCommissionPercent: 0.30,
  defaultCommissionPercent: 0.50,
  gstDomesticRate: 0.18
};

@Injectable({
  providedIn: 'root'
})
export class PlatformConfigService {
  private config$ = new BehaviorSubject<CommissionConfig | null>(null);
  private loading = false;
  private loaded = false;

  constructor(private http: HttpClient) {}

  loadConfig(): Observable<CommissionConfig> {
    if (this.loaded && this.config$.value) {
      return of(this.config$.value);
    }

    if (this.loading) {
      return this.config$.asObservable().pipe(
        map(config => config || CONFIG_FALLBACK)
      );
    }

    this.loading = true;

    return this.http.get<CommissionConfig>('/v1/public/config/commission').pipe(
      tap(data => {
        const config: CommissionConfig = {
          minCommissionPercent: data.minCommissionPercent,
          defaultCommissionPercent: data.defaultCommissionPercent,
          gstDomesticRate: data.gstDomesticRate
        };
        this.config$.next(config);
        this.loaded = true;
        this.loading = false;
      }),
      map(() => this.config$.value!),
      catchError(err => {
        console.warn('[PlatformConfigService] Failed to load config -- using fallback:', err.message);
        this.config$.next(CONFIG_FALLBACK);
        this.loaded = true;
        this.loading = false;
        return of(CONFIG_FALLBACK);
      })
    );
  }

  getMinCommission(): number {
    return this.config$.value?.minCommissionPercent ?? CONFIG_FALLBACK.minCommissionPercent;
  }

  getDefaultCommission(): number {
    return this.config$.value?.defaultCommissionPercent ?? CONFIG_FALLBACK.defaultCommissionPercent;
  }

  getGstRate(): number {
    return this.config$.value?.gstDomesticRate ?? CONFIG_FALLBACK.gstDomesticRate;
  }
}
