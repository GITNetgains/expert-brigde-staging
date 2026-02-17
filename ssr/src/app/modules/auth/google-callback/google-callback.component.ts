import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SsrCookieService } from 'ngx-cookie-service-ssr';
import { AuthService } from 'src/app/services/auth.service';
import { AppService } from 'src/app/services';
import { GoogleAuthService } from 'src/app/services/google-auth.service';

const SIGNUP_PENDING_KEY = 'expertbridge_signup_pending';

@Component({
  selector: 'app-google-callback',
  templateUrl: './google-callback.component.html',
  styleUrls: ['./google-callback.component.scss']
})
export class GoogleCallbackComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private appService: AppService,
    private googleAuth: GoogleAuthService,
    private cookies: SsrCookieService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    const code = this.route.snapshot.queryParamMap.get('code');
    const state = this.route.snapshot.queryParamMap.get('state');

    if (!code) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Tutor signup: exchange code for signupToken + profile, store pending, redirect to complete profile
    if (state === 'signup_tutor') {
      try {
        const data = await this.auth.signupWithGoogle(code);
        const pending = {
          step: 'details' as const,
          email: data.email,
          type: 'tutor' as const,
          signupToken: data.signupToken,
          name: data.name || '',
          avatarUrl: data.avatarUrl || ''
        };
        sessionStorage.setItem(SIGNUP_PENDING_KEY, JSON.stringify(pending));
        this.appService.toastSuccess('Complete your profile to finish signing up.');
        this.router.navigate(['/auth/sign-up'], { queryParams: { type: 'tutor' } });
      } catch (err: any) {
        const msg = err?.error?.message || err?.message || 'Google signup failed';
        this.appService.toastError(msg);
        this.router.navigate(['/auth/sign-up'], { queryParams: { type: 'tutor' } });
      }
      return;
    }

    // Login flow
    try {
      const resp = await this.auth.get(`/auth/login/google?code=${code}`);
      this.cookies.set('accessToken', resp.data.token, { path: '/' });
      this.cookies.set('isLoggedin', 'yes', { path: '/' });

      const user = await this.auth.getCurrentUser();
      if (user && user.type === 'tutor' && (user.rejected || user.pendingApprove || user.verified === false)) {
        this.auth.removeToken();
        this.router.navigate(['/auth/login']);
        return;
      }
      this.router.navigate(['/users/dashboard']);
    } catch (e) {
      this.router.navigate(['/auth/login']);
    }
  }
}
