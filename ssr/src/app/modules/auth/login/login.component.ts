import {
  AfterViewInit,
  Component,
  Inject,
  OnInit,
  PLATFORM_ID
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  AppService,
  AuthService,
  SeoService,
  StateService
} from 'src/app/services';
import { isPlatformBrowser } from '@angular/common';

@Component({
  templateUrl: 'login.component.html',
  styleUrls: ['login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {
  public step: 'email' | 'otp' | 'password' = 'email';
  public loginMode: 'otp' | 'password' = 'otp';
public otpResendTimer = 0;
private otpInterval: any = null;
public loading = false;
  public credentials = {
    email: '',
    password: ''
  };

  public otpCode = '';
  public submitted = false;
  public returnUrl = '';
  public showPassword = false;

togglePasswordVisibility() {
  this.showPassword = !this.showPassword;
}


  constructor(
    private auth: AuthService,
    public router: Router,
    private route: ActivatedRoute,
    private seoService: SeoService,
    private appService: AppService,
    @Inject(StateService) private store: StateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.seoService.setMetaTitle('Sign In');
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.returnUrl =
        this.route.snapshot.queryParams['returnUrl'] ||
        '/users/dashboard';

      const prefillEmail = this.route.snapshot.queryParams['email'];
      if (prefillEmail) {
        this.credentials.email = String(prefillEmail).toLowerCase();
      }
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const emailField = document.getElementById('email-input');
      if (emailField) {
        emailField.addEventListener('paste', (event: any) => {
          event.preventDefault();
          this.credentials.email = event.clipboardData
            .getData('Text')
            .trim();
        });
      }
    }
  }
startOtpTimer(seconds = 60) {
  this.otpResendTimer = seconds;

  if (this.otpInterval) {
    clearInterval(this.otpInterval);
  }

  this.otpInterval = setInterval(() => {
    this.otpResendTimer--;
    if (this.otpResendTimer <= 0) {
      clearInterval(this.otpInterval);
      this.otpInterval = null;
    }
  }, 1000);
}
ngOnDestroy() {
  if (this.otpInterval) {
    clearInterval(this.otpInterval);
  }
}


resendOtp() {
  if (this.otpResendTimer > 0 || this.loading) return;

  this.loading = true;

  this.auth.loginSendOtp({ email: this.credentials.email })
    .then(() => {
      this.loading = false;
      this.startOtpTimer(60);
      this.appService.toastSuccess('Verification code resent successfully.');
    })
    .catch(err => {
      this.loading = false;
      this.appService.toastError(err);
    });
}

  login(frm: any) {
  this.submitted = true;
  if (frm.invalid) return;

  this.credentials.email = this.credentials.email.toLowerCase().trim();

  if (this.loginMode === 'otp') {
    if (this.step === 'email') {
      this.loading = true;
      return this.auth.loginSendOtp({ email: this.credentials.email })
        .then(() => {
          this.loading = false;
          this.appService.toastSuccess('Verification code sent to your email.');
          this.step = 'otp';
          this.startOtpTimer(60);
        })
        .catch((err) => {
          this.loading = false;
          this.appService.toastError(err);
        });
    }
    if (this.step === 'otp') {
      if (!this.otpCode.trim()) {
        return this.appService.toastError('Please enter OTP');
      }
      this.loading = true;
      return this.auth.loginVerifyOtp({
        email: this.credentials.email,
        otp: this.otpCode.trim()
      })
        .then(() => {
          // Wait a bit for backend to sync state, then fetch fresh user data
          return new Promise(resolve => setTimeout(resolve, 300));
        })
        .then(() => this.auth.getCurrentUser())
        .then((user: any) => {
          this.loading = false;
          if (user && user.type === 'tutor' && (user.rejected || user.pendingApprove)) {
            this.appService.toastError('Your profile is pending admin approval. Please wait for approval email.');
            this.auth.removeToken();
            this.step = 'email';
            this.otpCode = '';
            return;
          }
          this.router.navigateByUrl(this.returnUrl);
        })
        .catch((err) => {
          this.loading = false;
          this.appService.toastError(err);
        });
    }
  } else {
    if (this.step === 'email') {
      this.step = 'password';
      return;
    }
    if (this.step === 'password') {
      if (!this.credentials.password) {
        return this.appService.toastError('Please enter password');
      }
      this.loading = true;
      return this.auth.login({
        email: this.credentials.email,
        password: this.credentials.password
      })
        .then(() => {
          // Wait a bit for backend to sync state, then fetch fresh user data
          return new Promise(resolve => setTimeout(resolve, 300));
        })
        .then(() => this.auth.getCurrentUser())
        .then((user: any) => {
          this.loading = false;
          if (user && user.type === 'tutor' && (user.rejected || user.pendingApprove)) {
            this.appService.toastError('Your profile is pending admin approval. Please wait for approval email.');
            this.auth.removeToken();
            this.step = 'email';
            this.credentials.password = '';
            return;
          }
          this.router.navigateByUrl(this.returnUrl);
        })
        .catch((err) => {
          this.loading = false;
          this.appService.toastError(err);
        });
    }
  }
}
}
