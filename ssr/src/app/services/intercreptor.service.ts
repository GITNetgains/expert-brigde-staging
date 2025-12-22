import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';

import { Observable } from 'rxjs';
import { SsrCookieService } from 'ngx-cookie-service-ssr';

@Injectable()
export class InterceptorService implements HttpInterceptor {
  constructor(private cookies: SsrCookieService) { }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.cookies.get('accessToken');
    if (token)
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    return next.handle(req);
  }
}
