// linkedin-callback.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { AppService } from 'src/app/services';

@Component({
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
      <div style="text-align: center;">
        <h2>Processing LinkedIn Login...</h2>
        <p>Please wait while we complete your authentication.</p>
      </div>
    </div>
  `
})
export class LinkedinCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private appService: AppService
  ) {}

  ngOnInit() {
    // Extract the authorization code from URL
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const state = params['state'];
      const error = params['error'];

      if (error) {
        this.appService.toastError('LinkedIn login was cancelled or failed');
        this.router.navigate(['/auth/login']);
        return;
      }

      if (!code) {
        this.appService.toastError('No authorization code received from LinkedIn');
        this.router.navigate(['/auth/login']);
        return;
      }

      // Send the code to your backend
      this.auth.loginWithLinkedin(code)
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
    });
  }
}

// ============================================
// auth.service.ts - Add this method
// ============================================

// Add this method to your AuthService class:
/*
loginWithLinkedin(code: string): Promise<any> {
  return this.httpClient
    .post(`${environment.apiBaseUrl}/v1/auth/login/linkedin`, { code })
    .toPromise()
    .then((resp: any) => {
      if (resp.data && resp.data.token) {
        this.setToken(resp.data.token);
        return resp.data;
      }
      throw new Error('Invalid response from server');
    });
}
*/

// ============================================
// app-routing.module.ts - Add this route
// ============================================

/*
import { LinkedinCallbackComponent } from './path/to/linkedin-callback.component';

const routes: Routes = [
  // ... your existing routes
  {
    path: 'auth/linkedin/callback',
    component: LinkedinCallbackComponent
  }
];
*/

// ============================================
// auth.module.ts - Declare the component
// ============================================

/*
import { LinkedinCallbackComponent } from './linkedin-callback/linkedin-callback.component';

@NgModule({
  declarations: [
    // ... other components
    LinkedinCallbackComponent
  ],
  // ... rest of module config
})
export class AuthModule { }
*/
