// src/app/auth.interceptor.ts
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../environments/environment';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const router = inject(Router);
  const token = (localStorage.getItem('accessToken') || '').trim();
  let authReq = req;
  const isApiRequest = req.url.includes(environment.apiUrl);
  const publicEndpoints = ['/auth/login', '/auth/forgot', '/auth/register'];
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));

  if (isApiRequest && !token && !isPublicEndpoint) {
    localStorage.removeItem('isLoggedIn');
    router.navigate(['/login']);
    return throwError(() => new Error('Missing access token'));
  }

  if (isApiRequest && token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      const msg = (error?.error?.message || '').toLowerCase();
      if (error.status === 401 || msg.includes('unauthenticated') || msg.includes('invalid token')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('isLoggedIn');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
}
