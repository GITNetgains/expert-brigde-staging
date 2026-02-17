  import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
  import { ReplaySubject, Subject } from 'rxjs';
  import { STATE, StateService } from './state-service';
  import { APIRequest } from './api-request';
  import { HttpClient } from '@angular/common/http';
  import { SsrCookieService } from 'ngx-cookie-service-ssr';
  import { isPlatformBrowser, isPlatformServer } from '@angular/common';
  import { SocketService } from './socket.service';
  import { IUser } from '../interface';
  @Injectable({
    providedIn: 'root'
  })
  export class AuthService extends APIRequest {
    private accessToken = '';
    private currentUser: any;
    private userLoaded = new Subject<any>();
    public userLoaded$ = this.userLoaded.asObservable();

    currentUserSubject = new ReplaySubject<IUser | null>(1);

    // ensure do not load if it is in the promise
    // because many component use get current user function
    private _getUser: any;
    isServer = false;
    isBrowser = false;
    constructor(
      private stateService: StateService,
      private myHttpService: HttpClient,
      @Inject(SsrCookieService) private mycookie: SsrCookieService,
      @Inject(PLATFORM_ID) private platformId: Object,
      private socket: SocketService
    ) {
      super(myHttpService);
      this.isBrowser = isPlatformBrowser(this.platformId);
      this.isServer = isPlatformServer(this.platformId);
    }

    isFetched(data: any): boolean {
      return typeof data !== 'undefined';
    }

    async initAppGetCurrentUser() {
      const token = this.mycookie.get('accessToken');
      if (!token) {
        this.currentUserSubject.next(null);
        return null;
      }
      if (this.isServer) {
        return this.getCurrentUser();
      } else {
        if (this.stateService.hasState(STATE.CURRENT_USER)) {
          this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
          this.socket.reconnect();
          if (this.isFetched(this.currentUser)) {
            this.currentUserSubject.next(this.currentUser);
          }
          return this.currentUser;
        } else {
          return this.getCurrentUser();
        }
      }
      // if (this.isBrowser) {
      //   const token = this.mycookie.get('accessToken');
      //   if (!token) return null;
      //   const baseApiEndpoint = this.getBaseApiEndpoint();
      //   const updatedUrl = `${baseApiEndpoint}/users/me`;
      //   return lastValueFrom(this.myHttpService.get(updatedUrl))
      //     .then((resp: any) => {
      //       this.currentUser = resp.data;
      //       this.mycookie.set('isLoggedin', 'yes');
      //       this.mycookie.set('timeZone', resp.data.timezone);
      //       this.userLoaded.next(resp.data);
      //       this.stateService.saveState('currentUser', this.currentUser);
      //       return this.currentUser;
      //     })
      //     .catch(() => {
      //       this.mycookie.delete('accessToken');
      //       this.mycookie.delete('isLoggedin');
      //       return null;
      //     });
      // }

    }

    async getCurrentUser() {
      // Only use cache when we have an actual user (not null). After removeToken()
      // or first login after signup, currentUser is null but was "fetched" - we must refetch.
      if (this.currentUser != null && this.isFetched(this.currentUser)) {
        this.currentUserSubject.next(this.currentUser);
        this.stateService.saveState('currentUser', this.currentUser);
        return new Promise((resolve) => resolve(this.currentUser));
      }

      if (this._getUser && typeof this._getUser.then === 'function') {
        return this._getUser;
      }
      

      this._getUser = await this.get('/users/me').then((resp: any) => {
        this.currentUser = resp.data;
        this.mycookie.set('isLoggedin', 'yes', { path: '/' });
        this.mycookie.set('timeZone', 'Asia/Kolkata', { path: '/' });
        this.userLoaded.next(resp.data);
        this.stateService.saveState('currentUser', this.currentUser);
        this.socket.reconnect();
        this.currentUserSubject.next(this.currentUser);
        return this.currentUser;
      }).catch(() => {
        this.mycookie.delete('accessToken', '/');
        this.mycookie.delete('isLoggedin', '/');
        this.stateService.removeState(STATE.CURRENT_USER);
        this.currentUserSubject.next(null);
        return null;
      });
      return this._getUser;
    }

    updateCurrentUser(current: any) {
      this.currentUser = { ...this.currentUser, ...current };
    }

    login(credentials: any): Promise<any> {
      return this.post('/auth/login', credentials).then((resp: any) => {
        this.mycookie.set('isLoggedin', 'yes', { path: '/' });
        this.mycookie.set('accessToken', resp.data.token, {
  path: '/',
  secure: true,
  sameSite: 'Strict'
});

        return this.getCurrentUser();
      });
    }

  loginWithLinkedin(code: string, redirectUri?: string): Promise<any> {
    const body: { code: string; redirect_uri?: string } = { code };
    if (redirectUri) body.redirect_uri = redirectUri;
    return this.post('/auth/login/linkedin', body).then((resp: any) => {
      this.mycookie.set('isLoggedin', 'yes', { path: '/' });
      this.mycookie.set('accessToken', resp.data.token, { path: '/' });
      return this.getCurrentUser();
    });
  }

  /** Tutor signup with Google: exchange code for signupToken + profile. Does not log in. */
  signupWithGoogle(code: string): Promise<{ signupToken: string; email: string; name: string; avatarUrl?: string }> {
    return this.post('/auth/signup/google', { code }).then((resp: any) => {
      const d = resp?.data?.data ?? resp?.data ?? resp;
      return { signupToken: d.signupToken, email: d.email, name: d.name, avatarUrl: d.avatarUrl || '' };
    });
  }

  /** Tutor signup with LinkedIn: exchange code for signupToken + profile. Does not log in. */
  signupWithLinkedin(code: string, redirectUri?: string): Promise<{ signupToken: string; email: string; name: string; avatarUrl?: string }> {
    const body: { code: string; redirect_uri?: string } = { code };
    if (redirectUri) body.redirect_uri = redirectUri;
    return this.post('/auth/signup/linkedin', body).then((resp: any) => {
      const d = resp?.data?.data ?? resp?.data ?? resp;
      return { signupToken: d.signupToken, email: d.email, name: d.name, avatarUrl: d.avatarUrl || '' };
    });
  }

    register(info: any): Promise<any> {
      return this.post('/auth/register', info);
    }

    verifyEmail(token: string): Promise<any> {
      return this.post('/auth/verifyEmail', { token });
    }

    completeRegistration(payload: any) {
      return this.post('/auth/complete-registration', payload);
    }

    getAccessToken(): any {
      if (!this.accessToken) {
        this.accessToken = this.mycookie.get('accessToken') || '';
      }

      return this.accessToken;
    }

    loginSendOtp(payload: any): Promise<any> {
  return this.post('/auth/login/sendOtp', payload);
}

loginVerifyOtp(payload: any): Promise<any> {
  return this.post('/auth/login/verifyOtp', payload).then((resp: any) => {
    this.mycookie.set('accessToken', resp.data.data.token, { path: '/' });
    this.mycookie.set('isLoggedin', 'yes', { path: '/' });
    return this.getCurrentUser();
  });
}


    forgot(email: string): Promise<any> {
      return this.post('/auth/forgot', { email });
    }

    removeToken() {
      this.mycookie.delete('accessToken', '/');
      this.mycookie.delete('isLoggedin', '/');
      this.mycookie.delete('timeZone', '/');

      this.currentUser = null as any;
      this._getUser = null;
      this.stateService.removeState(STATE.CURRENT_USER);
      this.currentUserSubject.next(null);
      try { this.socket.disconnect(); } catch {}
    }

    isLoggedin() {
      return this.mycookie.get('isLoggedin') === 'yes';
    }

    registerTutor(info: any): Promise<any> {
      return this.post('/tutors/register', info);
    }

   sendOtp(payload: any) {
  return this.post('/auth/sendOtp', payload);
}

verifyOtp(payload: any) {
  return this.post('/auth/verifyOtp', payload);
}

completeStudentSignup(payload: { signupToken: string; password: string; name: string; phoneNumber?: string; address?: string }) {
  return this.post('/auth/complete-student-signup', payload);
}

completeTutorSignup(payload: any) {
  return this.post('/auth/complete-tutor-signup', payload);
}

setPassword(payload: any) {
  return this.post('/auth/setPassword', payload);
}
updateStudentPersonalInfo(payload: any) {
  return this.post('/auth/student/personal-info', payload);
}

completeTutorProfile(payload: any) {
  return this.post('/auth/tutor/complete-profile', payload);
}
}