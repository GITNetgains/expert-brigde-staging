// import { style } from '@angular/animations';
// import { AfterViewInit, Component } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { GoogleAuthService } from 'src/app/services/google-auth.service';

// import {
//   AuthService,
//   SeoService,
//   AppService,
//   StateService,
//   STATE
// } from 'src/app/services';
// import { environment } from 'src/environments/environment';

// @Component({
//   templateUrl: 'signup.component.html',
//   styleUrls: ['signup.component.scss']
// })
// export class SignupComponent implements AfterViewInit {
//   public account: any = {
//     email: '',
//     password: '',
//     name: '',
//     type: '',
//     timezone: ''
//   };
//   public step: 'email' | 'otp' = 'email';
//   public otpToken: string = '';
//   private generatedPassword = '';
//   public lockType = false;
//   public accountTutor: any = {
//     email: '',
//     password: '',
//     name: '',
//     issueDocument: '',
//     resumeDocument: '',
//     certificationDocument: '',
//     timezone: '',
//     introVideoId: '',
//     introYoutubeId: ''
//   };
//   public introVideoType = 'upload';
//   public confirm: any = {
//     pw: ''
//   };
//   public maxFileSize: number;
//   public isPasswordMatched = false;
//   public submitted = false;
//   public idDocumentOptions: any = {};
//   public resumeOptions: any = {};
//   public certificationOptions: any = {};
//   public introVideoOptions: any = {};
//   public idDocumentFile: any;
//   public resumeFile: any;
//   public certificationFile: any;
//   public introVideo: any;
//   public appConfig: any;
//   public loading = false;
//   public isAgreeWithTerms = true;

//   constructor(
//     private auth: AuthService,
//     public router: Router,
//     private route: ActivatedRoute,
//     private seoService: SeoService,
//     private appService: AppService,
//     public stateService: StateService,
//     private googleAuth: GoogleAuthService
//   ) {
//     this.maxFileSize = environment.maximumFileSize;
//     this.appConfig = this.stateService.getState(STATE.CONFIG);
//     if (this.appConfig) {
//       const title = this.appConfig.siteName + ' - Sign Up';
//       this.seoService.setMetaTitle(title);
//     }

//     this.introVideoOptions = {
//       url: environment.apiBaseUrl + '/tutors/upload-introVideo',
//       onCompleteItem: (resp: any) => {
//         this.accountTutor.introVideoId = resp.data._id;
//         this.loading = false;
//       },
//       onFileSelect: (resp: any) => {
//         const lastIndex = resp.length - 1;
//         const file = resp[lastIndex].file;
//         const ext = file.name.split('.').pop().toLowerCase();
//         if (['mp4', 'webm', '3gp', 'ogg', 'wmv', 'webm'].indexOf(ext) === -1) {
//           this.introVideoOptions.uploader.clearQueue();
//           return this.appService.toastError('Invalid file type');
//         }
//         this.introVideo = file;
//       },
//       uploadOnSelect: true,
//       id: 'id-introVideo',
//       onUploading: () => (this.loading = true)
//     };

//     this.idDocumentOptions = {
//       url: environment.apiBaseUrl + '/tutors/upload-document',
//       onCompleteItem: (resp: any) => {
//         this.accountTutor.issueDocument = resp.data._id;
//         this.loading = false;
//       },
//       onFileSelect: (resp: any) => {
//         const lastIndex = resp.length - 1;
//         const file = resp[lastIndex].file;
//         const ext = file.name.split('.').pop().toLowerCase();
//         if (
//           ['pdf', 'doc', 'docx', 'zip', 'rar', 'jpg', 'jpeg', 'png'].indexOf(
//             ext
//           ) === -1
//         ) {
//           this.idDocumentOptions.uploader.clearQueue();
//           return this.appService.toastError('Invalid file type');
//         }
//         this.idDocumentFile = file;
//       },
//       uploadOnSelect: true,
//       id: 'id-document',
//       onUploading: () => (this.loading = true)
//     };
//     this.resumeOptions = {
//       url: environment.apiBaseUrl + '/tutors/upload-document',
//       onCompleteItem: (resp: any) => {
//         this.accountTutor.resumeDocument = resp.data._id;
//         this.loading = false;
//       },
//       onFileSelect: (resp: any) => {
//         const lastIndex = resp.length - 1;
//         const file = resp[lastIndex].file;
//         const ext = file.name.split('.').pop().toLowerCase();
//         if (['pdf'].indexOf(ext) === -1) {
//           this.resumeOptions.uploader.clearQueue();
//           return this.appService.toastError('Invalid file type');
//         }
//         this.resumeFile = file;
//       },
//       uploadOnSelect: true,
//       id: 'id-resume',
//       onUploading: () => (this.loading = true)
//     };
//     this.certificationOptions = {
//       url: environment.apiBaseUrl + '/tutors/upload-document',
//       onCompleteItem: (resp: any) => {
//         this.accountTutor.certificationDocument = resp.data._id;
//         this.loading = false;
//       },
//       onFileSelect: (resp: any) => {
//         const lastIndex = resp.length - 1;
//         const file = resp[lastIndex].file;
//         const ext = file.name.split('.').pop().toLowerCase();
//         if (['pdf'].indexOf(ext) === -1) {
//           this.certificationOptions.uploader.clearQueue();
//           return this.appService.toastError('Invalid file type');
//         }
//         this.certificationFile = file;
//       },
//       uploadOnSelect: true,
//       id: 'id-verification',
//       onUploading: () => (this.loading = true)
//     };

//     const t = this.route.snapshot.queryParams['type'];
//     if (t === 'tutor' || t === 'student') {
//       this.account.type = t;
//       this.lockType = true;
//     }
//   }

//   public onlyNumberKey(event: any) {
//     return event.charCode === 8 || event.charCode === 0
//       ? null
//       : event.charCode >= 48 && event.charCode <= 57;
//   }

//   public async submit(frm: any) {
//     this.submitted = true;
//     // Student email-only + OTP flow
//     if (this.account.type === 'student') {
//       // Step 1: send OTP by registering with a generated password
//       if (this.step === 'email') {
//         if (frm.invalid) {
//           return;
//         }
//         this.account.email = this.account.email.toLowerCase();
//         this.generatedPassword = Math.random().toString(36).slice(-10);
//         const payload = {
//           type: 'student',
//           email: this.account.email,
//           password: this.generatedPassword,
//           name: '',
//           timezone: ''
//         };
//         return this.auth
//           .register(payload)
//           .then(() => {
//             this.appService.toastSuccess('We sent a verification code to your email. Enter it to proceed.');
//             this.step = 'otp';
//             this.submitted = false;
//           })
//           .catch((err) => {
//             this.appService.toastError(err);
//           });
//       }
//       // Step 2: verify OTP and auto-login
//       if (this.step === 'otp') {
//         if (!this.otpToken || this.otpToken.trim() === '') {
//           return this.appService.toastError('Please enter verification code');
//         }
//         return this.auth
//           .verifyEmail(this.otpToken.trim())
//           .then(() => {
//             return this.auth.login({ email: this.account.email, password: this.generatedPassword });
//           })
//           .then((resp) => {
//             if (resp && resp._id) {
//               this.router.navigate(['/users/dashboard']);
//             }
//           })
//           .catch((err) => {
//             this.appService.toastError(err);
//           });
//       }
//       return;
//     }

//     // Legacy tutor flow
//     if (frm.invalid) {
//       return;
//     }
//     if (!this.account.timezone) {
//       return this.appService.toastError('Please select timezone');
//     }
//     if (this.account.password !== this.confirm.pw) {
//       this.isPasswordMatched = true;
//       return this.appService.toastError(
//         'Confirm password and password dont match'
//       );
//     }
//     if (this.account.type === '') {
//       return this.appService.toastError('Please select type');
//     }

//     this.account.email = this.account.email.toLowerCase();

//     if (this.account.type === 'tutor') {
//       this.accountTutor.name = this.account.name;
//       this.accountTutor.email = this.account.email;
//       this.accountTutor.password = this.account.password;
//       this.accountTutor.timezone = this.account.timezone;

//       if (this.introVideoType == 'upload' && !this.accountTutor.introVideoId) {
//         return this.appService.toastError('Please upload introduction video');
//       }
//       if (this.introVideoType === 'youtube') {
//         this.accountTutor.introVideoId = null;
//       }

//       if (
//         !this.accountTutor.issueDocument ||
//         !this.accountTutor.resumeDocument ||
//         !this.accountTutor.certificationDocument
//       ) {
//         return this.appService.toastError('Please upload all documents');
//       }
//       return this.auth
//         .registerTutor(this.accountTutor)
//         .then(() => {
//           this.appService.toastSuccess(
//             'Your account has been created, please verify your email then login'
//           );
//           this.router.navigate(['/auth/login']);
//         })
//         .catch((err) => {
//           this.appService.toastError(err);
//         });
//     }
//     this.auth
//       .register(this.account)
//       .then(() => {
//         this.appService.toastSuccess(
//           'Your account has been created, please verify your email then login'
//         );
//         this.router.navigate(['/auth/login']);
//       })
//       .catch((err) => {
//         console.log(err);

//         this.appService.toastError(err);
//       });
//   }

//   changeTimezone(event: any) {
//     if (event === 'Asia/Saigon') {
//       this.account.timezone = 'Asia/Ho_Chi_Minh';
//     } else {
//       this.account.timezone = event;
//     }
//   }

//   changeUploadType(event: any) {
//     if (event.target.value === 'youtube') {
//       this.accountTutor.introYoutubeId = 'ZU0gjnRU-Z4';
//     } else {
//       this.accountTutor.introYoutubeId = '';
//     }
//   }
//   loginWithGoogle() {
//   this.googleAuth.redirectToGoogleLogin();
// }


//   ngAfterViewInit() {
//     const target = document.getElementById('email-input') as any;
//     target.addEventListener(
//       'paste',
//       (event: any) => {
//         event.preventDefault();
//         const clipboard = event.clipboardData,
//           text = clipboard.getData('Text');
//         event.target.value = text.trim();
//         this.account.email = text.trim();
//       },
//       false
//     );
//   }
// }


//changes by navjot 10-12-25 11.27 


import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleAuthService } from 'src/app/services/google-auth.service';
import { LinkedinAuthService } from 'src/app/services/linkedin-auth.service';

import {
  AuthService,
  SeoService,
  AppService,
  StateService,
  STATE,
  TutorService
} from 'src/app/services';



@Component({
  templateUrl: 'signup.component.html',
  styleUrls: ['signup.component.scss']
})
export class SignupComponent
  implements OnInit, AfterViewInit, OnDestroy {

  /* =========================
   * BASIC STATE
   * ========================= */
  public account: any = {
    email: '',
    type: ''
  };

  public step:
    | 'email'
    | 'otp'
    | 'createPassword'
    | 'personalInfo'
    | 'tutorProfile' = 'email';

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

  /* =========================
   * PASSWORD
   * ========================= */
  public newPassword = '';
  public confirmPassword = '';

  /* =========================
   * STUDENT PROFILE
   * ========================= */
  public studentProfile = {
    name: '',
    phoneNumber: '',
    address: ''
  };

  /* =========================
   * TUTOR PROFILE
   * ========================= */
  public tutorProfile = {
    highlightsText: '',
    workHistoryText: '',
    consultationFee: null as number | null,
    yearsExperience: null as number | null
  };

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private seoService: SeoService,
    private appService: AppService,
    private stateService: StateService,
    private googleAuth: GoogleAuthService,
    private linkedinAuth: LinkedinAuthService,
    private tutorService: TutorService
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
   * INIT + RESTORE STATE
   * ========================= */
 ngOnInit() {
  // No persisted signup state
}

  ngAfterViewInit() {
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

  ngOnDestroy() {
    if (this.otpInterval) {
      clearInterval(this.otpInterval);
    }
  }

  /* =========================
   * SOCIAL LOGIN
   * ========================= */
  loginWithGoogle() {
    this.googleAuth.redirectToGoogleLogin();
  }

  loginWithLinkedin() {
    this.linkedinAuth.redirectToLinkedinLogin();
  }

  /* =========================
   * SIGNUP SUBMIT HANDLER
   * ========================= */
  submit(frm: any) {
    this.submitted = true;

    /* ---------- STEP 1: SEND OTP ---------- */
    if (this.step === 'email') {
      if (frm.invalid) return;

      return this.auth.sendOtp({
        email: this.account.email.toLowerCase(),
        type: this.account.type
      })
      .then(() => {
        this.step = 'otp';
        this.startOtpTimer(60);
        
        this.appService.toastSuccess('OTP sent to your email');
      })
      .catch(err => this.appService.toastError(err));
    }

    /* ---------- STEP 2: VERIFY OTP ---------- */
    if (this.step === 'otp') {
      if (!this.otpToken.trim()) {
        return this.appService.toastError('Enter OTP');
      }

      return this.auth.verifyOtp({
        email: this.account.email.toLowerCase(),
        otp: this.otpToken.trim()
      })
      .then(() => {
        this.step = 'createPassword';
        
        this.appService.toastSuccess('Verified. Create password');
      })
      .catch(err => this.appService.toastError(err));
    }

    /* ---------- STEP 3: CREATE PASSWORD ---------- */
    if (this.step === 'createPassword') {
      if (this.newPassword.length < 6) {
        return this.appService.toastError('Password must be at least 6 characters');
      }
      if (this.newPassword !== this.confirmPassword) {
        return this.appService.toastError('Passwords do not match');
      }

      return this.auth.setPassword({
        email: this.account.email.toLowerCase(),
        password: this.newPassword
      })
      .then(() => {
        if (this.account.type === 'student') {
          this.step = 'personalInfo';
          
          this.appService.toastSuccess('Password set. Complete personal info');
        } else {
                    this.appService.toastSuccess('Account created. Please login.');
          this.router.navigate(['/auth/login']);
        }
      })
      .catch(err => this.appService.toastError(err));
    }

    /* ---------- STEP 4: STUDENT PERSONAL INFO ---------- */
    if (this.step === 'personalInfo') {
      const { name, phoneNumber, address } = this.studentProfile;

      if (!name.trim() || !phoneNumber.trim() || !address.trim()) {
        return this.appService.toastError(
          'Please fill name, phone number and address'
        );
      }

      return this.auth.updateStudentPersonalInfo({
        email: this.account.email.toLowerCase(),
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim()
      })
      .then(() => {
                this.appService.toastSuccess('Account created. Please login.');
        this.router.navigate(['/auth/login']);
      })
      .catch(err => this.appService.toastError(err));
    }

    /* ---------- STEP 5: TUTOR PROFILE ---------- */
    if (this.step === 'tutorProfile') {
      const highlights = this.tutorProfile.highlightsText
        .split('\n').map(s => s.trim()).filter(Boolean);
      const workHistory = this.tutorProfile.workHistoryText
        .split('\n').map(s => s.trim()).filter(Boolean);

      if (!highlights.length || !workHistory.length || !this.tutorProfile.consultationFee) {
        return this.appService.toastError('Please complete tutor profile');
      }

      return this.tutorService.update({
        highlights,
        workHistory,
        consultationFee: this.tutorProfile.consultationFee,
        yearsExperience: this.tutorProfile.yearsExperience
      })
      .then(() => {
                this.appService.toastSuccess('Profile submitted. Pending admin approval.');
        this.router.navigate(['/users/dashboard']);
      })
      .catch(err => this.appService.toastError(err));
    }
  }

  /* =========================
   * OTP TIMER + RESEND
   * ========================= */
  startOtpTimer(seconds = 60) {
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

  resendOtp() {
    if (this.otpResendTimer > 0 || this.loading) return;

    this.loading = true;
    this.auth.sendOtp({
      email: this.account.email.toLowerCase(),
      type: this.account.type
    })
    .then(() => {
      this.loading = false;
      this.startOtpTimer(60);
      this.appService.toastSuccess('OTP resent successfully');
    })
    .catch(err => {
      this.loading = false;
      this.appService.toastError(err);
    });
  }

  /* =========================
   * LOCAL STORAGE HELPERS
   * ========================= */
 

  /* =========================
   * EMAIL DOMAIN CHECK
   * ========================= */
  isCompanyEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    const personal = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'icloud.com', 'aol.com', 'protonmail.com'
    ];
    return !personal.includes(domain);
  }
}