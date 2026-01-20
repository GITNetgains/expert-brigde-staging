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
      url: environment.apiBaseUrl + '/media/files',
      multiple: true,
      uploadOnSelect: true,
      accept:
        'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png',

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

      onUploading: (state: boolean) => (this.loading = state)
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
    const token = await grecaptcha.execute(
      '6Lce7CQsAAAAAAI1CTK6C6AfG7GQjd3IsC_qS08n',
      { action: 'ai_search' }
    );

    const resp = await this.ai.search(this.query, token);
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
      this.router.navigate(['/']);
    }
  }, 1000);
}

// ai-result.component.ts logic tweaks
submitting = false; // New flag for production safety

async submit() {
  if (!this.editableText.trim() || this.submitting) return;

  // 1. Validation Logic
  if (!this.auth.isLoggedin()) {
    if (!this.lead.name || !this.lead.email || !this.lead.phone) {
      this.appService.toastError('Please fill all contact details');
      return;
    }
  } else {
    const u = await this.auth.getCurrentUser();
    this.lead.email = u.email;
    this.lead.name = u.name;
    this.lead.phone = u.phoneNumber;
  }

  try {
    this.submitting = true; // Start loading state
    await this.userService.addAiQuery({
      query: this.query,
      description: this.editableText,
      lead: this.lead,
      aiAttachmentIds: this.aiAttachmentIds
    });

    this.appService.toastSuccess('Request submitted successfully');
    this.submittedSuccess = true;
    this.startCountdown(); 
    
  } catch (err: any) {
    // Extract specific backend error message if available
    const msg = err?.error?.message || 'An error occurred. Please try again.';
    this.appService.toastError(msg);
  } finally {
    this.submitting = false; // Reset loading state
  }
}

goToLogin() { 
  const returnUrl = this.router.createUrlTree(
    ['/pages/ai-result'], 
    { queryParams: { q: this.query } }
  ).toString(); 
  this.router.navigate(['/auth/login'], { queryParams: { returnUrl } }); 
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
