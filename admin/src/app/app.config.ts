import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
  withHashLocation,
  withInMemoryScrolling,
  withRouterConfig,
  withViewTransitions
} from '@angular/router';

import { DropdownModule, SidebarModule } from '@coreui/angular';
import { IconSetService } from '@coreui/icons-angular';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { provideDaterangepickerLocale } from 'ngx-daterangepicker-bootstrap';
import { FormlyModule } from '@ngx-formly/core';
import { DaterangepickerFieldType } from '@components/shared/formly/type/daterangepicker-field.type';
import { AnimatedFieldWrapper } from '@components/shared/formly/wrapper/animated-field.wrapper';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDaterangepickerLocale({
      separator: ' - ',
      applyLabel: 'Okay',
    }),
    importProvidersFrom([
      FormlyModule.forRoot({
        types: [
          {
            name: 'daterangepicker',
            component: DaterangepickerFieldType,
            wrappers: ['form-field'],
          },
        ],
        wrappers: [
          {
            name: 'form-field',
            component: AnimatedFieldWrapper,
          },
        ],
      }),
    ]),
    provideRouter(
      routes,
      withRouterConfig({
        onSameUrlNavigation: 'reload'
      }),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      }),
      withEnabledBlockingInitialNavigation(),
      withViewTransitions(),
      withHashLocation()
    ),
    importProvidersFrom(SidebarModule, DropdownModule),
    IconSetService,
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
  ]
};
