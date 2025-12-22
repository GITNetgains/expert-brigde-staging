import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule, isDevMode } from '@angular/core';

import { AppComponent } from './app.component';
import { NotFoundComponent } from './modules/general/not-found/not-found.component';
import { AppRoutingModule } from './app-routing.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpClientModule
} from '@angular/common/http';

import { HeaderModule } from './components/header/header.module';
import { FooterModule } from './components/footer/footer.module';
import { AppService } from './services/app-service';
import { ToastrModule } from 'ngx-toastr';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AuthService, InterceptorService, SystemService } from './services';
import { FullComponent } from './layouts/full/full.component';
import { BlankComponent } from './layouts/blank/blank.component';
import { CookieService } from 'ngx-cookie-service';
import { SsrCookieService } from 'ngx-cookie-service-ssr';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HomeModule } from './modules/home/home.module';
import { SharedModule } from './shared.module';
import { NgOptimizedImage } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SpinnerComponent } from './components/uis/spinner.component';
import { environment } from 'src/environments/environment';
import { DashboardLayoutComponent } from './layouts/dashboard/dashboard.component';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
const config: SocketIoConfig = {
  url: environment.socketUrl,
  options: { query: {}, transports: ['websocket'], autoConnect: false }
};
export interface IEnvironment {
  production: boolean;
  version: string;
  build: number;
  maximumFileSize: number;
  apiBaseUrl: string;
  platform: string;
  showBuild: boolean;
  stripeKey: string;
  url: string;
  socketUrl: string;
  zoomSDK: string;
  zoomSiteUrl: string;
  showDemoPopup: boolean;
  googleProviderId: string;
  facebookProviderId: string;
}

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(
    http,
    `${environment.apiBaseUrl}/i18n/`,
    '.json'
  );
  // return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    NotFoundComponent,
    FullComponent,
    BlankComponent,
    SpinnerComponent,
    DashboardLayoutComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'livelearn-ssr-app' }),
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    HeaderModule,
    FooterModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    ToastrModule.forRoot({
      timeOut: 5000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    }),
    NgbModule,
    HomeModule,
    SharedModule,
    NgOptimizedImage,
    SocketIoModule.forRoot(config)
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory:
        (app: AppService, auth: AuthService, system: SystemService) =>
        async () =>
          await app.getData().then(async () => {
            await system.configs();
            await auth.initAppGetCurrentUser();
          }),
      deps: [AppService, AuthService, SystemService],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: InterceptorService,
      multi: true
    },
    CookieService,
    SsrCookieService
    // SocketService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
