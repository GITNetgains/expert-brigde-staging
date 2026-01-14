import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AuthService } from './shared/auth.service';
import { RouterModule } from '@angular/router';
import { AppService } from './app.service';

export interface IEnvironment {
  production: boolean;
  zoomSDK: string;
  mainUrl: string;
  apiBaseUrl: string;
}

export function init_app(appService: AppService) {
  return () => appService.load();
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
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
