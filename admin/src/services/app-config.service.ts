import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';
import { tap } from 'rxjs/operators';

export interface AppConfig {
  currencySymbol?: string;
  [key: string]: unknown;
}

/**
 * Holds app-wide config (e.g. currency from Settings) so all admin views
 * can show the correct currency. Populated by the app config resolver.
 */
@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private config: AppConfig = {};

  constructor(private configService: ConfigService) {}

  setConfig(config: AppConfig): void {
    this.config = config ?? {};
  }

  getConfig(): AppConfig {
    return this.config;
  }

  /** Load config from API and store it. Used by resolver; can be called to refresh. */
  loadAndSet(): ReturnType<ConfigService['getAppConfig']> {
    return this.configService.getAppConfig().pipe(
      tap((c) => this.setConfig(c as AppConfig))
    );
  }
}
