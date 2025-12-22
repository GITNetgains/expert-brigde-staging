import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private Auth: AuthService) { }

  canActivate() {
    return this.Auth.currentUserSubject.pipe(
      map((userInfo) => {
        if (!userInfo) {
          return this.router.parseUrl('/auth/login');
        }
        if (
          userInfo?.type === 'tutor' &&
          ((userInfo as any).rejected || (userInfo as any).pendingApprove || (userInfo as any).verified === false)
        ) {
          return this.router.parseUrl('/auth/login');
        }
        return true;
      })
    );
  }
}
