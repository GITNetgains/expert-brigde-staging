import { DOCUMENT, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import { firstValueFrom } from 'rxjs';
import { StateService } from './state-service';
import { environment } from '../../environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  environment!: any;
  baseURL!: string;

  // configUrl = `${
  //   environment.production
  //     ? '/assets/configs/prod.config.json'
  //     : '/assets/configs/dev.config.json'
  // }`;

  constructor(
    private state: StateService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    @Optional() @Inject(REQUEST) private request: any,
    private translate: TranslateService,
    private toastrService: ToastrService
  ) {}

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  get isServer(): boolean {
    return isPlatformServer(this.platformId);
  }

  async getData(): Promise<any> {
    if (this.isServer) {
      const host: string = this.request.get('host');
      this.baseURL =
        (host.startsWith('localhost') ? 'http://' : 'https://') + host;
      this.environment = await this.fetchData();
      this.state.saveState('environment', this.environment);
    } else {
      if (this.state.hasState('environment')) {
        this.environment = this.state.getState('environment');
      } else {
        this.baseURL = this.document.location.origin;
        this.environment = await this.fetchData();
        this.state.saveState('environment', this.environment);
      }
    }
  }

  toastSuccess(message: string) {
    return this.toastrService.success(this.translate.instant(message));
  }

  toastError(err?: any) {
    const getError = (err?: any): string => {
      if (!err) return 'Something went wrong, please try again';
      if (typeof err === 'string') {
        return err;
      }
      if (err && err.data) {
        return (err.data.data && err.data.data.message) || err.data.message;
      }
      return err.message || 'Something went wrong, please try again';
    };

    return this.toastrService.error(
      this.translate.instant(getError(err || null))
    );
  }

  private async fetchData(): Promise<any> {
    return environment;
    // return await firstValueFrom<any>(
    //   this.http.get(this.baseURL + this.configUrl)
    // );
  }
}
