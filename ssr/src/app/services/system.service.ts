import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { STATE, StateService } from './state-service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { isPlatformServer } from '@angular/common';
import { SsrCookieService } from 'ngx-cookie-service-ssr';
import { IUser } from '../interface';

@Injectable({
  providedIn: 'root'
})
export class SystemService {
  public appConfig: any = null;
  isServer = false;
  constructor(
    private stateService: StateService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cookies: SsrCookieService
  ) {
    this.isServer = isPlatformServer(this.platformId);
  }

  async configs() {
    if (this.isServer) {
      this.appConfig = await this.fetchConfig();
      const userLang =
        this.cookies.get('userLang') ||
        this.appConfig.i18n.defaultLanguage ||
        'en';
      this.appConfig.userLang = userLang;
      this.stateService.saveState(STATE.CONFIG, this.appConfig);
    } else {
      if (this.stateService.hasState(STATE.CONFIG)) {
        this.appConfig = this.stateService.getState(STATE.CONFIG);
      } else {
        this.appConfig = await this.fetchConfig();
        const userLang =
          this.cookies.get('userLang') ||
          this.appConfig.i18n.defaultLanguage ||
          'en';
        this.appConfig.userLang = userLang;
        localStorage.setItem('currencySymbol', this.appConfig.currencySymbol);
        this.stateService.saveState(STATE.CONFIG, this.appConfig);
      }
    }
    return this.appConfig;
  }

  private async fetchConfig(): Promise<any> {
    const { apiBaseUrl } = this.stateService.getState('environment') as any;
    const updatedUrl = apiBaseUrl
      ? `${apiBaseUrl}/system/configs/public`
      : 'http://localhost:9000/v1/system/configs/public';
    return await firstValueFrom<any>(this.http.get(updatedUrl))
      .then((resp) => resp.data)
      .catch((err) => console.log('configerr>>>>', err));
  }

  setUserLang(lang: string) {
    this.cookies.set('userLang', lang, { path: '/' });
  }

  showBooking(): boolean {
    const current = this.stateService.getState(STATE.CURRENT_USER) as IUser;
    if (!current || (current && current.type === 'student')) return true;
    const config = this.stateService.getState(STATE.CONFIG) as any;
    return current && current.type === 'tutor' && config && config.allowTutorBooking ? true : false;
  }
}
