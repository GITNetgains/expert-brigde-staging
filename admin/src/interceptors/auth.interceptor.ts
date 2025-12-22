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
  const token = localStorage.getItem('accessToken');
  let authReq = req;
  const isApiRequest = req.url.includes(environment.apiUrl);
  const publicEndpoints = ['/auth/login', '/auth/forgot', '/auth/register'];
  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));
  
  if (isApiRequest && !token && !isPublicEndpoint) {
    router.navigate(['/login']);
    return next(req).pipe(
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  if (token) {
    authReq = req.clone({
      headers: req.headers.append('Authorization', `Bearer ${token}`),
    });
    return next(authReq);
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
