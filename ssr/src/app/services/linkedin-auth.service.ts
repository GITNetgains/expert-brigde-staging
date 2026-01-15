import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LinkedinAuthService {

  private clientId = (environment as any).LINKEDIN_CLIENT_ID || '';
  private redirectUri = (environment as any).YOUR_LINKEDIN_REDIRECT_URI || '';

  constructor() {}

  getLinkedinOAuthUrl(): string {
    // Manual URL construction to avoid double-encoding
    const state = this.generateRandomState();
    
    const url = 'https://www.linkedin.com/oauth/v2/authorization' +
      `?response_type=code` +
      `&client_id=${encodeURIComponent(this.clientId)}` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&scope=${encodeURIComponent('email,openid,profile,r_events')}` +
      `&state=${encodeURIComponent(state)}`;

    return url;
  }

  redirectToLinkedinLogin() {
    window.location.href = this.getLinkedinOAuthUrl();
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
