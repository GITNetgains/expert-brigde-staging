import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../auth.service';

@Injectable({ providedIn: 'root' })
export class StudentGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.auth.currentUserSubject.pipe(
      map((userInfo) => {
        // Not logged in → send to login
        if (!userInfo) {
          return this.router.parseUrl('/auth/login');
        }

        const anyUser: any = userInfo as any;
        const isStudent =
          anyUser.role === 'user' ||
          anyUser.type === 'student';

        // If not a student (e.g. tutor), show access denied instead of redirecting to dashboard
        if (!isStudent) {
          return this.router.parseUrl('/pages/error/NO_ACCESS');
        }

        return true;
      })
    );
  }
}

