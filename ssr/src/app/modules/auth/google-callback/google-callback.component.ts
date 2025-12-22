import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SsrCookieService } from 'ngx-cookie-service-ssr';
import { AuthService } from 'src/app/services/auth.service';
import { GoogleAuthService } from 'src/app/services/google-auth.service';

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
    private googleAuth: GoogleAuthService,
    private cookies: SsrCookieService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

 async ngOnInit() {
  if (!isPlatformBrowser(this.platformId)) return;

  const code = this.route.snapshot.queryParamMap.get('code');
  if (!code) {
    this.router.navigate(['/auth/login']);
    return;
  }

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
