import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {

  private clientId = (environment as any).YOUR_GOOGLE_CLIENT_ID || '';
  private redirectUri = (environment as any).YOUR_GOOGLE_REDIRECT_URI || '';

  constructor() {}

  getGoogleOAuthUrl(): string {
    const params = {
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    };

    const query = new URLSearchParams(params).toString();
    return `https://accounts.google.com/o/oauth2/v2/auth?${query}`;
  }

  redirectToGoogleLogin() {
    window.location.href = this.getGoogleOAuthUrl();
  }

  extractCodeFromCallback(): string | null {
    const url = new URL(window.location.href);
    return url.searchParams.get('code');
  }
}
