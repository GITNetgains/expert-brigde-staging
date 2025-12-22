// src/app/auth.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { ILoginResponse, IResponse } from '../interfaces';
import { IProfile } from '../interfaces/profile.interface';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loginUrl = `${environment.apiUrl}/auth/login`;
  private profileUrl = `${environment.apiUrl}/users/me`;

  // BehaviorSubject to hold the user profile (null initially)
  private userProfileSubject = new BehaviorSubject<any | null>(null);
  // Public Observable for components to subscribe to
  userProfile$: Observable<any | null> = this.userProfileSubject.asObservable();
  private router = inject(Router);

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.loadProfile();
    } else {
      this.router.navigate(['/login']);
    }
  }

  login(credentials: { email: string; password: string }): Observable<IResponse<ILoginResponse>> {
    return this.http.post<IResponse<ILoginResponse>>(this.loginUrl, credentials).pipe(
      tap((response) => {
        const { token } = response.data;

        if (token) {
          localStorage.setItem('accessToken', token); // Store token
          localStorage.setItem('isLoggedIn', 'yes'); // Store login state
          this.loadProfile();
        }
      })
    );
  }

  private loadProfile(): void {
    this.http.get<IResponse<IProfile>>(this.profileUrl).subscribe({
      next: (profile) => {
        const { data } = profile;
        this.userProfileSubject.next(data); // Update profile
      },
      error: (err) => {
        this.userProfileSubject.next(null);
        this.logout();
      },
    });
  }

  forgot(email: string): Observable<IResponse<any>> {
    return this.http.post<IResponse<any>>(`${environment.apiUrl}/auth/forgot`, { email });
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('isLoggedIn'); // Clear token on logout
    this.router.navigate(['/login']); // Redirect to login
  }

  isLoggedIn(): boolean {
    return localStorage.getItem('isLoggedIn') === 'yes';
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getCurrentUser(): Observable<IProfile | any> {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      this.logout();
      return this.userProfile$;
    }

    if (this.userProfileSubject.value) {
      return this.userProfile$;
    }

    return this.http.get<IResponse<IProfile>>(this.profileUrl).pipe(
      tap({
        next: (res) => {
          const profile = res.data;

          if (profile.role !== 'admin') {
            this.logout();
            throw new Error('Invalid role!');
          }

          this.userProfileSubject.next(profile);
        },
        error: () => {
          this.userProfileSubject.next(null);
          this.logout();
        },
      })
    );
  }
}
