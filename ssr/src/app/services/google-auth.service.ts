import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {

  private clientId = (environment as any).YOUR_GOOGLE_CLIENT_ID || '';
  private redirectUri = (environment as any).YOUR_GOOGLE_REDIRECT_URI || '';

  constructor() {}

  /** @param state Optional state (e.g. 'signup_tutor') to distinguish signup from login on callback */
  getGoogleOAuthUrl(state?: string): string {
    const params: Record<string, string> = {
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    };
    if (state) params['state'] = state;

    const query = new URLSearchParams(params).toString();
    return `https://accounts.google.com/o/oauth2/v2/auth?${query}`;
  }

  redirectToGoogleLogin() {
    window.location.href = this.getGoogleOAuthUrl();
  }

  /** Redirect to Google for tutor signup; callback will create SignupSession and send user to complete profile */
  redirectToGoogleSignup() {
    window.location.href = this.getGoogleOAuthUrl('signup_tutor');
  }

  extractCodeFromCallback(): string | null {
    const url = new URL(window.location.href);
    return url.searchParams.get('code');
  }
}
