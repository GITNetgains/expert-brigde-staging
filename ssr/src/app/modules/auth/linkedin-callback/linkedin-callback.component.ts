// linkedin-callback.component.ts
import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { LinkedinAuthService } from 'src/app/services/linkedin-auth.service';
import { AppService } from 'src/app/services';

const SIGNUP_PENDING_KEY = 'expertbridge_signup_pending';

@Component({
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
      <div style="text-align: center;">
        <h2>Processing LinkedIn {{ isSignup ? 'Sign Up' : 'Login' }}...</h2>
        <p>Please wait while we complete your authentication.</p>
      </div>
    </div>
  `
})
export class LinkedinCallbackComponent implements OnInit {
  isSignup = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private linkedinAuth: LinkedinAuthService,
    private appService: AppService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    const params = this.route.snapshot.queryParams;
    const code = params['code'];
    const state = params['state'];
    const error = params['error'];

    if (error) {
      this.appService.toastError('LinkedIn was cancelled or failed');
      this.router.navigate(['/auth/login']);
      return;
    }

    if (!code) {
      this.appService.toastError('No authorization code received from LinkedIn');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.isSignup = state === 'signup_tutor';

    const redirectUri = this.linkedinAuth.getRedirectUri();
    if (state === 'signup_tutor') {
      this.auth.signupWithLinkedin(code, redirectUri)
        .then((data) => {
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
          this.router.navigate(['/auth/sign-up'], { queryParams: { type: 'expert' } });
        })
        .catch((err: any) => {
          const msg = err?.error?.message || err?.message || 'LinkedIn signup failed';
          this.appService.toastError(msg);
          this.router.navigate(['/auth/sign-up'], { queryParams: { type: 'expert' } });
        });
      return;
    }

    this.auth.loginWithLinkedin(code, redirectUri)
      .then(() => this.auth.getCurrentUser())
      .then((user: any) => {
        if (user && user.type === 'tutor' && (user.rejected || user.pendingApprove || user.verified === false)) {
          this.appService.toastError('Your profile is pending admin approval. Please wait for approval email.');
          this.auth.removeToken();
          this.router.navigate(['/auth/login']);
          return;
        }
        this.appService.toastSuccess('Successfully logged in with LinkedIn!');
        this.router.navigate(['/users/dashboard']);
      })
      .catch((err) => {
        console.error('LinkedIn login error:', err);
        this.appService.toastError('Failed to complete LinkedIn login');
        this.router.navigate(['/auth/login']);
      });
  }
}
