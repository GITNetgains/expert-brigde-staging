import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AuthService } from './shared/auth.service';
import { RestangularModule } from 'ngx-restangular';
import { RouterModule } from '@angular/router';
import Cookies from 'js-cookie';
import { AppService } from './app.service';

export interface IEnvironment {
  production: boolean;
  zoomSDK: string;
  mainUrl: string;
  apiBaseUrl: string;
}

export function RestangularConfigFactory(RestangularProvider, appService: AppService) {
  // TODO - change default config
  const config = appService.settings as IEnvironment;
  const accessToken = Cookies.get('accessToken');
  RestangularProvider.setBaseUrl(config.apiBaseUrl);
  RestangularProvider.addFullRequestInterceptor((element, operation, path, url, headers, params) => {
    // Auto add token to header
    headers.Authorization = 'Bearer ' + accessToken;
    return {
      headers: headers
    };
  });

  RestangularProvider.addErrorInterceptor((response, subject, responseHandler) => {
    // force logout and relogin
    if (response.status === 401) {
      Cookies.remove('accessToken');
      Cookies.remove('isLoggedin');
      return false; // error handled
    }

    return true; // error not handled
  });
}

export function init_app(appService: AppService) {
  return () => appService.load();
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    RestangularModule.forRoot([AppService], RestangularConfigFactory),
    RouterModule.forRoot([])
  ],
  providers: [
    AuthService,
    {
      provide: APP_INITIALIZER,
      useFactory: init_app,
      deps: [AppService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
