import { AfterViewInit, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleAuthService } from 'src/app/services/google-auth.service';
import { LinkedinAuthService } from 'src/app/services/linkedin-auth.service';

import {
  AuthService,
  SeoService,
  AppService,
  StateService,
  STATE,
  CountryService
} from 'src/app/services';

const SIGNUP_PENDING_KEY = 'expertbridge_signup_pending';

interface PendingSignup {
  step: 'details';
  email: string;
  type: 'tutor' | 'student';
  signupToken?: string;
  name?: string;
  avatarUrl?: string;
}

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
    type: '',
    avatarUrl: '' as string | undefined
  };

  public step: 'email' | 'otp' | 'details' = 'email';

  public lockType = false;
  public submitted = false;
  public loading = false;
  public isAgreeWithTerms = true;

  /** Set after verifyOtp; required to complete signup (user is created only then). */
  private signupToken = '';

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
    state: '',
    city: '',
    issueDocumentId: '',
    resumeDocumentId: '',
    certificationDocumentId: '',
    introVideoType: 'upload',
    introVideoId: '',
    introYoutubeId: '',
    bio: '',
    highlights: [] as string[],
    yearsExperience: null as number | null,
    skillNames: [] as string[],
    industryNames: [] as string[],
    languages: [] as string[],
    education: [] as { title: string; organization?: string; fromYear: number; toYear?: number }[],
    experience: [] as { title: string; organization?: string; fromYear: number; toYear?: number }[]
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
    private countryService: CountryService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    const config: any = this.stateService.getState(STATE.CONFIG);
    if (config?.siteName) {
      this.seoService.setMetaTitle(config.siteName + ' - Sign Up');
    }
    

  const viewType = this.route.snapshot.queryParams['type'];
const mappedType = this.mapViewTypeToAccountType(viewType);

if (mappedType) {
  this.account.type = mappedType; // tutor | student
  this.lockType = true;
}


  }
 private mapViewTypeToAccountType(
  viewType: string
): 'tutor' | 'student' | '' {
  if (viewType === 'expert') return 'tutor';
  if (viewType === 'client') return 'student';
  return '';
}
 

  /* =========================
   * LIFECYCLE HOOKS
   * ========================= */
  ngOnInit(): void {
    this.countries = this.countryService.countries;
    const base = (this.auth as any).getBaseApiEndpoint();
    this.docUploadUrl = `${base}/tutors/upload-document`;
    this.introUploadUrl = `${base}/tutors/upload-introVideo`;
    this.restoreSignupState();
  }

  /** Restore from query (e.g. login redirect) or sessionStorage. If URL type=expert|client and stored pending is for the other type, clear and show email step so we never mix expert/client flows. */
  private restoreSignupState(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const qStep = this.route.snapshot.queryParams['step'];
    const qEmail = this.route.snapshot.queryParams['email'];
    const qType = this.route.snapshot.queryParams['type'] as string | undefined;
    const urlAccountType = this.mapViewTypeToAccountType(qType || '');

    const fromQuery: PendingSignup | null = qStep === 'details' && qEmail
      ? { step: 'details', email: String(qEmail).toLowerCase().trim(), type: (qType === 'tutor' || qType === 'student' ? qType : urlAccountType || 'student') as 'tutor' | 'student' }
      : null;

    const storedPending = this.getPendingSignup();
    const pending = fromQuery ?? storedPending;

    if (urlAccountType && storedPending && storedPending.type !== urlAccountType) {
      this.clearPendingSignup();
      this.signupToken = '';
      this.step = 'email';
      this.account.email = '';
      this.account.type = urlAccountType;
      this.lockType = true;
      return;
    }

    if (pending) {
      this.step = 'details';
      this.account.email = pending.email;
      this.account.type = pending.type;
      this.account.avatarUrl = pending.avatarUrl;
      this.lockType = true;
      if (pending.signupToken) {
        this.signupToken = pending.signupToken;
      }
      if (pending.name && this.account.type === 'tutor') {
        this.tutorProfile.name = pending.name;
      }
    }
    if (urlAccountType) {
      this.account.type = urlAccountType;
      this.lockType = true;
    }
  }

  private getPendingSignup(): PendingSignup | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const raw = sessionStorage.getItem(SIGNUP_PENDING_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as PendingSignup;
      if (data.step !== 'details' || !data.email || !data.type) return null;
      if (data.signupToken) this.signupToken = data.signupToken;
      return data;
    } catch {
      this.clearPendingSignup();
      return null;
    }
  }

  private setPendingSignup(data: PendingSignup): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      sessionStorage.setItem(SIGNUP_PENDING_KEY, JSON.stringify(data));
    } catch {}
  }

  private clearPendingSignup(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      sessionStorage.removeItem(SIGNUP_PENDING_KEY);
    } catch {}
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
   * SOCIAL SIGNUP / LOGIN (tutor: signup → complete profile; otherwise login)
   * ========================= */
  loginWithGoogle(): void {
    if (this.account.type === 'tutor') {
      this.googleAuth.redirectToGoogleSignup();
    } else {
      this.googleAuth.redirectToGoogleLogin();
    }
  }

  loginWithLinkedin(): void {
    if (this.account.type === 'tutor') {
      this.linkedinAuth.redirectToLinkedinSignup();
    } else {
      this.linkedinAuth.redirectToLinkedinLogin();
    }
  }

  passwordRules = {
  length: false,
  uppercase: false,
  lowercase: false,
  number: false,
  special: false
};

checkPasswordRules(password: string): void {
  this.passwordRules.length = password.length >= 8;
  this.passwordRules.uppercase = /[A-Z]/.test(password);
  this.passwordRules.lowercase = /[a-z]/.test(password);
  this.passwordRules.number = /\d/.test(password);
  this.passwordRules.special = /[@$!%*?&]/.test(password);
}

isPasswordValid(): boolean {
  return Object.values(this.passwordRules).every(Boolean);
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

if (
  this.account.type === 'student' &&
  !this.isCompanyEmail(this.account.email)
) {
  this.appService.toastError('Please use a company email address');
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
        const res: any = await this.auth.verifyOtp({
          email: this.account.email.toLowerCase().trim(),
          otp: this.otpToken.trim()
        });
        const data = res?.data?.data ?? res?.data ?? res;
        const token = data?.signupToken;
        if (!token) {
          this.appService.toastError('Invalid response. Please try again.');
          return;
        }
        this.signupToken = token;
        this.step = 'details';
        this.submitted = false;
        const email = this.account.email.toLowerCase().trim();
        this.setPendingSignup({ step: 'details', email, type: this.account.type, signupToken: token });
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
  return; // inline error already visible
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
    if (phoneNumber && !this.isValidPhone(phoneNumber)) {
      this.appService.toastError('Please enter valid phone number');
      return;
    }
    if (address && address.length < 5) {
      this.appService.toastError('Please enter valid address');
      return;
    }
    if (!this.signupToken) {
      this.appService.toastError('Session expired. Please start signup again.');
      this.clearPendingSignup();
      this.step = 'email';
      this.loading = false;
      return;
    }

    try {
      await this.auth.completeStudentSignup({
        signupToken: this.signupToken,
        password: this.newPassword,
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim()
      });
      this.clearPendingSignup();
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
    if (!this.signupToken) {
      this.appService.toastError('Session expired. Please start signup again.');
      this.clearPendingSignup();
      this.step = 'email';
      this.loading = false;
      return;
    }

    try {
      const payload: any = {
        signupToken: this.signupToken,
        password: this.newPassword,
        name: this.tutorProfile.name.trim(),
        resumeDocumentId: this.tutorProfile.resumeDocumentId,
        ...(this.account.avatarUrl ? { avatarUrl: this.account.avatarUrl } : {}),
        timezone: this.tutorProfile.timezone,
        country: this.tutorProfile.country,
        address: this.tutorProfile.address,
        phoneNumber: this.tutorProfile.phoneNumber,
        zipCode: this.tutorProfile.zipCode,
        state: this.tutorProfile.state,
        city: this.tutorProfile.city,
        issueDocumentId: this.tutorProfile.issueDocumentId,
        certificationDocumentId: this.tutorProfile.certificationDocumentId,
        introVideoId: this.tutorProfile.introVideoType === 'upload' ? this.tutorProfile.introVideoId : undefined,
        introYoutubeId: this.tutorProfile.introVideoType === 'youtube' ? (this.tutorProfile.introYoutubeId || this.tutorProfile.introVideoId) : undefined,
        idYoutube: this.tutorProfile.introYoutubeId || this.tutorProfile.introVideoId,
        bio: this.tutorProfile.bio,
        highlights: this.tutorProfile.highlights,
        yearsExperience: this.tutorProfile.yearsExperience,
        skillNames: this.tutorProfile.skillNames,
        industryNames: this.tutorProfile.industryNames,
        languages: this.tutorProfile.languages,
        education: this.tutorProfile.education,
        experience: this.tutorProfile.experience
      };
      await this.auth.completeTutorSignup(payload);
      this.clearPendingSignup();
      this.appService.toastSuccess('Expert profile submitted. You can now log in.');
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

    if (!this.tutorProfile.resumeDocumentId) {
      errors.push('Please upload your resume/CV');
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

  /** Filter countries by name starting with search term (e.g. type "i" → India, Iceland) */
  countrySearchFn = (term: string, item: any) => {
    if (!term || !item?.name) return true;
    return item.name.toLowerCase().startsWith(term.toLowerCase());
  };

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
  if (!email) return false;

  const emailRegex =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;

  return emailRegex.test(email.trim());
}


  isValidPhone(phone: string): boolean {
    // Allows +, digits, spaces, (), -
    const phoneRegex = /^[+]?[\d\s()-]{10,20}$/;
    return phoneRegex.test(phone);
  }

 isCompanyEmail(email: string): boolean {
  if (!this.isValidEmail(email)) return false;

  const domain = email.split('@')[1].toLowerCase();

  // ❌ must contain dot
  if (!domain.includes('.')) return false;

  // ❌ no leading/trailing dot
  if (domain.startsWith('.') || domain.endsWith('.')) return false;

  const personalDomains = new Set([
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'aol.com',
    'protonmail.com'
  ]);

  return !personalDomains.has(domain);
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
    this.clearPendingSignup();
  }

  goBackToOtp(): void {
    this.step = 'otp';
    this.newPassword = '';
    this.confirmPassword = '';
  }
}