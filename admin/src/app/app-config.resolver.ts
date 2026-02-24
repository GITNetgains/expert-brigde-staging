import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { AppConfigService } from '../services/app-config.service';

/**
 * Resolves app config (e.g. currencySymbol from Settings), stores it in AppConfigService,
 * so all admin views (including child routes) can show the correct currency.
 */
export const appConfigResolver: ResolveFn<Record<string, unknown>> = () => {
  return inject(AppConfigService).loadAndSet();
};
