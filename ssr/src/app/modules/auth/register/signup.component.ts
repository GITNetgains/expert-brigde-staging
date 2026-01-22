import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleAuthService } from 'src/app/services/google-auth.service';
import { LinkedinAuthService } from 'src/app/services/linkedin-auth.service';

import {
  AuthService,
  SeoService,
  AppService,
  StateService,
  STATE,
  TutorService,
  CountryService
} from 'src/app/services';

@Component({
  templateUrl: 'signup.component.html',
  styleUrls: ['signup.component.scss']
})
export class SignupComponent implements OnInit, AfterViewInit, OnDestroy {
  /* =========================
   * BASIC STATE
   * ========================= */
  public account: any = {
    email: '',
    type: ''
  };

  public step: 'email' | 'otp' | 'details' = 'email';

  public lockType = false;
  public submitted = false;
  public loading = false;
  public isAgreeWithTerms = true;

  /* =========================
   * OTP
   * ========================= */
  public otpToken = '';
  public otpResendTimer = 0;
  private otpInterval: any = null;

  public newPassword = '';
  public confirmPassword = '';
  public showPassword = false;
  public showConfirmPassword = false;

  public studentProfile = {
    name: '',
    phoneNumber: '',
    address: ''
  };

  public tutorProfile = {
    name: '',
    timezone: '',
    country: null as any,
    address: '',
    phoneNumber: '',
    zipCode: '',
    issueDocumentId: '',
    resumeDocumentId: '',
    certificationDocumentId: '',
    introVideoType: 'upload',
    introVideoId: '',
    introYoutubeId: ''
  };

  public countries: any[] = [];
  public docUploadUrl = '';
  public introUploadUrl = '';
  public uploadProgress: any = {};

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private seoService: SeoService,
    private appService: AppService,
    private stateService: StateService,
    private googleAuth: GoogleAuthService,
    private linkedinAuth: LinkedinAuthService,
    private tutorService: TutorService,
    private countryService: CountryService
  ) {
    const config: any = this.stateService.getState(STATE.CONFIG);
    if (config?.siteName) {
      this.seoService.setMetaTitle(config.siteName + ' - Sign Up');
    }

    const t = this.route.snapshot.queryParams['type'];
    if (t === 'student' || t === 'tutor') {
      this.account.type = t;
      this.lockType = true;
    }
  }

  /* =========================
   * LIFECYCLE HOOKS
   * ========================= */
  ngOnInit(): void {
    this.countries = this.countryService.countries;
    const base = (this.auth as any).getBaseApiEndpoint();
    this.docUploadUrl = `${base}/tutors/upload-document`;
    this.introUploadUrl = `${base}/tutors/upload-introVideo`;
  }

  ngAfterViewInit(): void {
    const input = document.getElementById('email-input') as any;
    if (input) {
      input.addEventListener('paste', (e: any) => {
        e.preventDefault();
        const text = e.clipboardData.getData('Text').trim();
        input.value = text;
        this.account.email = text;
      });
    }
  }

  ngOnDestroy(): void {
    if (this.otpInterval) {
      clearInterval(this.otpInterval);
    }
  }

  /* =========================
   * SOCIAL LOGIN
   * ========================= */
  loginWithGoogle(): void {
    this.googleAuth.redirectToGoogleLogin();
  }

  loginWithLinkedin(): void {
    this.linkedinAuth.redirectToLinkedinLogin();
  }

  /* =========================
   * PASSWORD VALIDATION
   * ========================= */
  validatePassword(password: string): { valid: boolean; message: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { valid: false, message: 'Password must contain lowercase letter' };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return { valid: false, message: 'Password must contain uppercase letter' };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { valid: false, message: 'Password must contain number' };
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return { valid: false, message: 'Password must contain special character (@$!%*?&)' };
    }
    return { valid: true, message: '' };
  }

  getPasswordStrength(password: string): string {
    if (!password) return '';
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  }

  /* =========================
   * SIGNUP SUBMIT HANDLER
   * ========================= */
  async submit(frm: any): Promise<void> {
    this.submitted = true;

    /* ---------- STEP 1: SEND OTP ---------- */
    if (this.step === 'email') {
      if (frm.invalid) return;

      if (!this.account.type) {
        this.appService.toastError('Please select account type');
        return;
      }

      if (!this.isValidEmail(this.account.email)) {
        this.appService.toastError('Please enter a valid email address');
        return;
      }

      this.loading = true;

      try {
        await this.auth.sendOtp({
          email: this.account.email.toLowerCase().trim(),
          type: this.account.type
        });

        this.step = 'otp';
        this.startOtpTimer(60);
        this.appService.toastSuccess('OTP sent to your email');
      } catch (err) {
        this.appService.toastError(err);
      } finally {
        this.loading = false;
      }
      return;
    }

    /* ---------- STEP 2: VERIFY OTP ---------- */
    if (this.step === 'otp') {
      if (!this.otpToken.trim() || this.otpToken.length !== 6) {
        this.appService.toastError('Please enter valid 6-digit OTP');
        return;
      }

      this.loading = true;

      try {
        await this.auth.verifyOtp({
          email: this.account.email.toLowerCase().trim(),
          otp: this.otpToken.trim()
        });

        this.step = 'details';
        this.submitted = false;
        this.appService.toastSuccess('OTP verified. Complete your profile');
      } catch (err) {
        this.appService.toastError(err);
      } finally {
        this.loading = false;
      }
      return;
    }

    /* ---------- STEP 3: COMPLETE PROFILE ---------- */
    if (this.step === 'details') {
      // Validate password
      const passwordValidation = this.validatePassword(this.newPassword);
      if (!passwordValidation.valid) {
        this.appService.toastError(passwordValidation.message);
        return;
      }

      if (this.newPassword !== this.confirmPassword) {
        this.appService.toastError('Passwords do not match');
        return;
      }

      this.loading = true;

      try {
        if (this.account.type === 'student') {
          await this.completeStudentProfile();
        } else {
          await this.completeTutorProfile();
        }
      } catch (err) {
        this.appService.toastError(err);
        this.loading = false;
      }
    }
  }

  /* =========================
   * COMPLETE STUDENT PROFILE
   * ========================= */
  private async completeStudentProfile(): Promise<void> {
    const { name, phoneNumber, address } = this.studentProfile;

    if (!name.trim()) {
      this.appService.toastError('Please enter your name');
      this.loading = false;
      return;
    }

    if (!phoneNumber.trim() || !this.isValidPhone(phoneNumber)) {
      this.appService.toastError('Please enter valid phone number');
      this.loading = false;
      return;
    }

    if (!address.trim() || address.length < 5) {
      this.appService.toastError('Please enter valid address');
      this.loading = false;
      return;
    }

    try {
      // Set password first
      await this.auth.setPassword({
        email: this.account.email.toLowerCase().trim(),
        password: this.newPassword
      });

      // Update profile
      await this.auth.updateStudentPersonalInfo({
        email: this.account.email.toLowerCase().trim(),
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim()
      });

      this.appService.toastSuccess('Account created successfully. Please login.');
      this.router.navigate(['/auth/login']);
    } finally {
      this.loading = false;
    }
  }

  /* =========================
   * COMPLETE TUTOR PROFILE
   * ========================= */
  private async completeTutorProfile(): Promise<void> {
    const errors = this.validateTutorProfile();
    if (errors.length > 0) {
      this.appService.toastError(errors[0]);
      this.loading = false;
      return;
    }

    try {
      // Set password first
      await this.auth.setPassword({
        email: this.account.email.toLowerCase().trim(),
        password: this.newPassword
      });

      // Complete tutor profile
      await this.auth.completeTutorProfile({
        email: this.account.email.toLowerCase().trim(),
        name: this.tutorProfile.name.trim(),
        timezone: this.tutorProfile.timezone,
        country: this.tutorProfile.country,
        address: this.tutorProfile.address.trim(),
        phoneNumber: this.tutorProfile.phoneNumber.trim(),
        zipCode: this.tutorProfile.zipCode.trim(),
        issueDocumentId: this.tutorProfile.issueDocumentId,
        resumeDocumentId: this.tutorProfile.resumeDocumentId,
        certificationDocumentId: this.tutorProfile.certificationDocumentId,
        introVideoId:
          this.tutorProfile.introVideoType === 'upload'
            ? this.tutorProfile.introVideoId
            : null,
        introYoutubeId:
          this.tutorProfile.introVideoType === 'youtube'
            ? this.extractYoutubeId(this.tutorProfile.introYoutubeId.trim())
            : '',
        idYoutube:
          this.tutorProfile.introVideoType === 'youtube'
            ? this.extractYoutubeId(this.tutorProfile.introYoutubeId.trim())
            : ''
      });

      this.appService.toastSuccess('Tutor profile submitted. Pending admin approval.');
      this.auth.removeToken();
      this.router.navigate(['/auth/login']);
    } finally {
      this.loading = false;
    }
  }

  /* =========================
   * TUTOR VALIDATION
   * ========================= */
  private validateTutorProfile(): string[] {
    const errors: string[] = [];

    if (!this.tutorProfile.name.trim()) {
      errors.push('Please enter your name');
    }

    if (!this.tutorProfile.timezone) {
      errors.push('Please select timezone');
    }

    if (!this.tutorProfile.country) {
      errors.push('Please select country');
    }

    if (!this.tutorProfile.address.trim() || this.tutorProfile.address.length < 5) {
      errors.push('Please enter valid address');
    }

    if (!this.tutorProfile.phoneNumber.trim() || !this.isValidPhone(this.tutorProfile.phoneNumber)) {
      errors.push('Please enter valid phone number');
    }

    if (!this.tutorProfile.zipCode.trim() || this.tutorProfile.zipCode.length < 3) {
      errors.push('Please enter valid zip code');
    }

    if (!this.tutorProfile.issueDocumentId) {
      errors.push('Please upload ID document');
    }

    if (!this.tutorProfile.resumeDocumentId) {
      errors.push('Please upload resume');
    }

    if (!this.tutorProfile.certificationDocumentId) {
      errors.push('Please upload certification');
    }

    if (this.tutorProfile.introVideoType === 'upload' && !this.tutorProfile.introVideoId) {
      errors.push('Please upload intro video');
    }

    if (this.tutorProfile.introVideoType === 'youtube' && !this.tutorProfile.introYoutubeId.trim()) {
      errors.push('Please enter YouTube video URL');
    }

    return errors;
  }

  /* =========================
   * OTP TIMER + RESEND
   * ========================= */
  startOtpTimer(seconds: number = 60): void {
    this.otpResendTimer = seconds;
    if (this.otpInterval) clearInterval(this.otpInterval);

    this.otpInterval = setInterval(() => {
      this.otpResendTimer--;
      if (this.otpResendTimer <= 0) {
        clearInterval(this.otpInterval);
        this.otpInterval = null;
      }
    }, 1000);
  }

  async resendOtp(): Promise<void> {
    if (this.otpResendTimer > 0 || this.loading) return;

    this.loading = true;

    try {
      await this.auth.sendOtp({
        email: this.account.email.toLowerCase().trim(),
        type: this.account.type
      });

      this.startOtpTimer(60);
      this.appService.toastSuccess('OTP resent successfully');
    } catch (err) {
      this.appService.toastError(err);
    } finally {
      this.loading = false;
    }
  }

  /* =========================
   * FORM HELPERS
   * ========================= */
  onTimezoneChange(tz: string): void {
    this.tutorProfile.timezone = tz;
  }

  onCountrySelect(code: string): void {
    const country = this.countries.find((x: any) => x.code === code);
    this.tutorProfile.country = country || null;
  }

  /* =========================
   * FILE UPLOAD HANDLERS
   * ========================= */
  private extractUploadId(resps: any): string {
    const r = Array.isArray(resps) ? resps[0] : resps;
    return (
      r?.response?.data?._id ||
      r?.response?.data?.id ||
      r?.data?._id ||
      r?._id ||
      ''
    );
  }

  onIssueUploadFinish(resps: any): void {
    this.tutorProfile.issueDocumentId = this.extractUploadId(resps);
    this.uploadProgress.issue = false;
  }

  onResumeUploadFinish(resps: any): void {
    this.tutorProfile.resumeDocumentId = this.extractUploadId(resps);
    this.uploadProgress.resume = false;
  }

  onCertUploadFinish(resps: any): void {
    this.tutorProfile.certificationDocumentId = this.extractUploadId(resps);
    this.uploadProgress.cert = false;
  }

  onIntroUploadFinish(resps: any): void {
    this.tutorProfile.introVideoId = this.extractUploadId(resps);
    this.uploadProgress.intro = false;
  }

  onUploadStart(type: string): void {
    this.uploadProgress[type] = true;
  }

  /* =========================
   * YOUTUBE ID EXTRACTOR
   * ========================= */
  extractYoutubeId(input: string): string {
    if (!input) return '';

    try {
      const url = new URL(input);
      if (url.hostname.includes('youtu.be')) {
        return url.pathname.replace('/', '');
      }
      if (url.hostname.includes('youtube.com')) {
        const v = url.searchParams.get('v');
        if (v) return v;
      }
    } catch {
      // If not a valid URL, assume it's already an ID
      return input;
    }

    return input;
  }

  /* =========================
   * VALIDATION HELPERS
   * ========================= */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone: string): boolean {
    // Allows +, digits, spaces, (), -
    const phoneRegex = /^[+]?[\d\s()-]{10,20}$/;
    return phoneRegex.test(phone);
  }

  isCompanyEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    const personalDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'icloud.com',
      'aol.com',
      'protonmail.com'
    ];

    return !personalDomains.includes(domain);
  }

  /* =========================
   * UI HELPERS
   * ========================= */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onOtpInput(event: any): void {
    // Only allow digits
    const value = event.target.value.replace(/\D/g, '');
    this.otpToken = value.substring(0, 6);
    event.target.value = this.otpToken;
  }

  goBackToEmail(): void {
    this.step = 'email';
    this.otpToken = '';
    if (this.otpInterval) {
      clearInterval(this.otpInterval);
      this.otpInterval = null;
    }
  }

  goBackToOtp(): void {
    this.step = 'otp';
    this.newPassword = '';
    this.confirmPassword = '';
  }
}