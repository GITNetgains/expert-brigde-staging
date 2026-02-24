import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { AiService } from 'src/app/services/ai.service';
import { AppService, StateService, STATE, UserService, AuthService } from 'src/app/services';
import { environment } from 'src/environments/environment';
import { isPlatformBrowser } from '@angular/common'; // Added isPlatformBrowser
declare var grecaptcha: any;

@Component({
  selector: 'app-ai-result',
  templateUrl: './ai-result.component.html',
  styleUrls: ['./ai-result.component.scss']
})
export class AiResultComponent implements OnInit, OnDestroy {

  query = '';
  answer = '';
  editableText = '';

  extractedRole = '';
  extractedIndustry = '';

  
  loading = false;
  error: string | null = null;
  submittedSuccess = false;

  confirmationText =
    'Thank you, your submission has been received successfully. Someone from our team will get in touch with you very soon.';

  countdown = 10;
  countdownInterval: any = null;
  routerSub: any = null;

  aiFileUploadOptions: any;
  aiAttachmentIds: string[] = [];
  uploadedAttachments: { id: string; name: string }[] = [];
  removeAttachment(index: number) {
    this.aiAttachmentIds.splice(index, 1);
    this.uploadedAttachments.splice(index, 1);
}

  isClientUser = false;
  private _uploadResolver: ((value: any) => void) | null = null;

  constructor(
    private route: ActivatedRoute,
    private ai: AiService,
    private userService: UserService,
    private appService: AppService,
    private stateService: StateService,
    private router: Router,
    public auth: AuthService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit() {
    this.aiFileUploadOptions = {
      url: environment.apiBaseUrl + '/tutors/upload-document',
      multiple: true,
      uploadOnSelect: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      accept:
        'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/jpg',

      // prevent experts + force login
      onFileSelect: async (resp: any[]) => {
        const last = resp[resp.length - 1];
        const file = last.file;
        const ext = (file?.name || '').split('.').pop()?.toLowerCase() || '';
        const allowed = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];

        if (!allowed.includes(ext)) {
          this.appService.toastError('Invalid file type');
          return false;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          this.appService.toastError('File size too large. Maximum allowed is 10MB.');
          return false;
        }

        return true;
      },

      
      // after upload, save files
      onFinish: (res: any | any[]) => {
        const items = Array.isArray(res) ? res : [res];

        for (const it of items) {
          const id = it?.data?.file?._id || it?.data?._id || it?._id;
          const name = it?.data?.file?.name || it?.data?.name;

          if (id && !this.aiAttachmentIds.includes(id)) {
            this.aiAttachmentIds.push(id);
            this.uploadedAttachments.push({ id, name });
          }
        }

        if (this._uploadResolver) {
          this._uploadResolver(items);
          this._uploadResolver = null;
        }
      },

      onUploading: (state: boolean) => (this.loading = state),

      onError: (error: any) => {
        this.appService.toastError('File upload failed. Please try again.');
        console.error('Upload error:', error);
      }
    };

    // determine user type
  this.auth.getCurrentUser().then((u: any) => {
      this.isClientUser = !!u && u.type !== 'tutor';
    });

    this.route.queryParams.subscribe(async (params) => {
      this.query = params['q'] || '';
      this.extractKeywords(this.query);

      if (this.query) await this.fetch();

      // 2. Wrap localStorage in a Browser Check
      if (isPlatformBrowser(this.platformId)) {
        const pending = localStorage.getItem('pendingAiSubmission');
        if (pending && this.auth.isLoggedin()) {
          try {
            const data = JSON.parse(pending);
            if (data && data.text) this.editableText = data.text;
          } catch {}
          localStorage.removeItem('pendingAiSubmission');
          this.submit();
        }
      }
    });

    this.routerSub = this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationStart) {
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
        }
      }
    });
  }

  extractKeywords(query: string) {
    const parts = query.split(' in ');
    this.extractedRole = parts[0] || '';
    this.extractedIndustry = parts[1] || 'Industry';
  }

 async fetch() {
  this.loading = true;
  try {
    

   const resp = await this.ai.search(this.query);

    const data: any = resp?.data ?? {};

    const answer =
      data?.answer ??
      data?.searchResult?.answer ??
      (typeof data?.searchResult === 'string' ? data?.searchResult : '');

    this.answer = answer || '';
    this.editableText = this.answer;
  } catch (err: any) {
    // Show backend error if available else generic message
    const msg = err?.error ;

    this.appService.toastError(msg);

    // Redirect after short delay
    setTimeout(() => {
      this.router.navigate(['/']);
    }, 1500);

    return; // do NOT show on-screen error
  } finally {
    this.loading = false;
  }
}


  reset() {
    this.editableText = this.answer;
  }

  /** Update URL with current query and re-fetch AI result (allows changing search on same page) */
  searchAgain() {
    const q = (this.query || '').trim();
    if (!q || this.loading) return;
    this.router.navigate(['/pages/ai-result'], { queryParams: { q } });
    // Route queryParams subscription will run and call fetch()
  }

lead = {
  name: '',
  email: '',
  phone: ''
};

// Inside AiResultComponent class

startCountdown() {
  // Clear any existing interval first to prevent overlaps
  if (this.countdownInterval) {
    clearInterval(this.countdownInterval);
  }

  this.countdown = 10; // Reset to 10 seconds

  this.countdownInterval = setInterval(() => {
    this.countdown--;
    
    if (this.countdown <= 0) {
      clearInterval(this.countdownInterval);
        if (this.auth.isLoggedin()) {
        this.router.navigate(['/users/dashboard']); // ✅ logged-in
      } else {
        this.router.navigate(['/']);           // ✅ guest
      }
    }
  }, 1000);
}

// ai-result.component.ts logic tweaks
submitting = false; // New flag for production safety

aiStep: 'form' | 'otp' | 'success' = 'form';
otpCode = '';
otpTimer = 60;
otpInterval: any = null;

resendOtp() {
  if (this.otpTimer > 0 || this.submitting) return;

  this.submitting = true;

  this.userService.sendAiOtp({ email: this.lead.email })
    .then(() => {
      this.appService.toastSuccess('OTP resent successfully');
      this.startOtpTimer();
    })
    .catch(err => {
      this.appService.toastError(err?.error?.message);
    })
    .finally(() => {
      this.submitting = false;
    });
}

startOtpTimer() {
  this.otpTimer = 60;

  if (this.otpInterval) clearInterval(this.otpInterval);

  this.otpInterval = setInterval(() => {
    this.otpTimer--;
    if (this.otpTimer <= 0) {
      clearInterval(this.otpInterval);
    }
  }, 1000);
}

async submit() {
  if (!this.editableText.trim() || this.submitting) return;

  // 🔐 LOGGED-IN USER → DIRECT SUBMIT
  if (this.auth.isLoggedin()) {
    try {
      this.submitting = true;

      let captchaToken = '';
      if (isPlatformBrowser(this.platformId)) {
        captchaToken = await grecaptcha.execute(
          '6Lce7CQsAAAAAAI1CTK6C6AfG7GQjd3IsC_qS08n',
          { action: 'ai_query_submit' }
        );
      }

      await this.userService.addAiQuery({
        query: this.query,
        description: this.editableText,
        aiAttachmentIds: this.aiAttachmentIds,
        captchaToken
      });

      this.submittedSuccess = true;
      this.aiStep = 'success';
      this.startCountdown();
    } catch (err: any) {
      this.appService.toastError(
        err?.error?.message || 'Something went wrong'
      );
    } finally {
      this.submitting = false;
    }
    return;
  }

  // 👤 GUEST USER → CHECK EMAIL FIRST
  if (!this.lead.email) {
    this.appService.toastError('Email is required');
    return;
  }

  if (!this.isCompanyEmail(this.lead.email)) {
    this.appService.toastError('Please use your company email address');
    return;
  }

  try {
    this.submitting = true;

    // Generate captcha token for checkEmailAndSubmit
    let captchaToken = '';
    if (isPlatformBrowser(this.platformId)) {
      captchaToken = await grecaptcha.execute(
        '6Lce7CQsAAAAAAI1CTK6C6AfG7GQjd3IsC_qS08n',
        { action: 'ai_check_email' }
      );
    }

    // Check if email exists and submit if registered
    const response = await this.userService.checkEmailAndSubmit({
      email: this.lead.email,
      query: this.query,
      description: this.editableText,
      aiAttachmentIds: this.aiAttachmentIds,
      lead: {
        name: this.lead.name,
        phone: this.lead.phone
      },
      captchaToken
    });

    // Check the response structure
    const data = response?.data || response;

    // If user exists, submission successful
    if (data?.userExists === true) {
      this.submittedSuccess = true;
      this.aiStep = 'success';
      this.appService.toastSuccess('Query submitted successfully!');
      this.startCountdown();
    } else {
      // User doesn't exist, send OTP (no captcha needed - already validated)
      await this.userService.sendAiOtp({ 
        email: this.lead.email
      });
      
      this.aiStep = 'otp';
      this.startOtpTimer();
      this.appService.toastSuccess('OTP sent to your email');
    }
  } catch (err: any) {
    const msg =
      err?.data?.message ||
      err?.error?.message ||
      'Unable to process request';

    this.appService.toastError(msg);
  } finally {
    this.submitting = false;
  }
}
async verifyOtp() {
  if (!this.otpCode.trim()) {
    this.appService.toastError('Please enter OTP');
    return;
  }

  try {
    this.submitting = true;

    let captchaToken = '';
    if (isPlatformBrowser(this.platformId)) {
      captchaToken = await grecaptcha.execute(
        '6Lce7CQsAAAAAAI1CTK6C6AfG7GQjd3IsC_qS08n',
        { action: 'ai_verify_otp' }
      );
    }

 await this.userService.verifyAiOtp({
  email: this.lead.email,   // ✅ ROOT
  otp: this.otpCode,
  query: this.query,
  description: this.editableText,
  aiAttachmentIds: this.aiAttachmentIds,
  lead: {
    name: this.lead.name,
    phone: this.lead.phone
  },
  captchaToken
});
    this.submittedSuccess = true;
    this.aiStep = 'success';
    this.startCountdown();

  } catch (err: any) {
    this.appService.toastError(
      err?.error?.message || 'Invalid or expired OTP'
    );
  } finally {
    this.submitting = false;
  }
}

goToLogin() { 
  const returnUrl = this.router.createUrlTree(
    ['/pages/ai-result'], 
    { queryParams: { q: this.query } }
  ).toString(); 
  this.router.navigate(['/auth/login'], { queryParams: { returnUrl } }); 
}
isValidEmail(email: string): boolean {
  if (!email) return false;

  const emailRegex =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;

  return emailRegex.test(email.trim());
}


isCompanyEmail(email: string): boolean {
  if (!this.isValidEmail(email)) return false;

  const domain = email.split('@')[1].toLowerCase();

  // ❌ must contain dot
  if (!domain.includes('.')) return false;

  // ❌ no leading / trailing dot
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


  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    if (this.routerSub) {
      this.routerSub.unsubscribe();
      this.routerSub = null;
    }
  }
}