import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LinkedinAuthService {

  private clientId = (environment as any).LINKEDIN_CLIENT_ID || '';
  private redirectUri = (environment as any).YOUR_LINKEDIN_REDIRECT_URI || '';

  constructor() {}

  getRedirectUri(): string {
    return this.redirectUri;
  }

  /** @param state Optional state (e.g. 'signup_tutor') to distinguish signup from login on callback */
  getLinkedinOAuthUrl(state?: string): string {
    const stateParam = state || this.generateRandomState();
    return 'https://www.linkedin.com/oauth/v2/authorization' +
      `?response_type=code` +
      `&client_id=${encodeURIComponent(this.clientId)}` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&scope=${encodeURIComponent('openid,profile,email')}` +
      `&state=${encodeURIComponent(stateParam)}`;
  }

  redirectToLinkedinLogin(): void {
    window.location.href = this.getLinkedinOAuthUrl();
  }

  /** Redirect to LinkedIn for tutor signup; callback will create SignupSession and send user to complete profile */
  redirectToLinkedinSignup(): void {
    window.location.href = this.getLinkedinOAuthUrl('signup_tutor');
  }

  extractCodeFromCallback(): string | null {
    return new URL(window.location.href).searchParams.get('code');
  }

  extractStateFromCallback(): string | null {
    return new URL(window.location.href).searchParams.get('state');
  }

  private generateRandomState(): string {
    return Math.random().toString(36).substring(2);
  }
}
