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


import { AfterViewInit, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleAuthService } from 'src/app/services/google-auth.service';
import { LinkedinAuthService } from 'src/app/services/linkedin-auth.service';

import {
  AuthService,
  SeoService,
  AppService,
  StateService,
  STATE,
  UserService,
  TutorService
} from 'src/app/services';

@Component({
  templateUrl: 'signup.component.html',
  styleUrls: ['signup.component.scss']
})
export class SignupComponent implements AfterViewInit {
  public account: any = {
    email: '',
    type: ''
  };

  public step: 'email' | 'otp' | 'createPassword' | 'personalInfo' | 'tutorProfile' = 'email';
  public otpToken: string = '';
  public submitted = false;
  public loading = false;
  public isAgreeWithTerms = true;
  public lockType = false;
  public newPassword: string = '';
  public confirmPassword: string = '';
  public allowPersonalEmail = false;
  public tutorProfile: {
    highlightsText: string;
    workHistoryText: string;
    consultationFee: number | null;
    yearsExperience: number | null;
  } = {
    highlightsText: '',
    workHistoryText: '',
    consultationFee: null,
    yearsExperience: null
  };
  public studentProfile: {
    name: string;
    phoneNumber: string;
    address: string;
  } = {
    name: '',
    phoneNumber: '',
    address: ''
  };

  constructor(
    private auth: AuthService,
    public router: Router,
    private route: ActivatedRoute,
    private seoService: SeoService,
    private appService: AppService,
    public stateService: StateService,
    private googleAuth: GoogleAuthService,
    private linkedinAuth: LinkedinAuthService,
    private userService: UserService,
    private tutorService: TutorService
  ) {
  const appConfig: any = this.stateService.getState(STATE.CONFIG);

if (appConfig?.siteName) {
  this.seoService.setMetaTitle(appConfig.siteName + ' - Sign Up');
}


    const t = this.route.snapshot.queryParams['type'];
    if (t === 'tutor' || t === 'student') {
      this.account.type = t;
      this.lockType = true;
    }
  }

  ngAfterViewInit() {
    const target = document.getElementById('email-input') as any;
    if (target) {
      target.addEventListener(
        'paste',
        (event: any) => {
          event.preventDefault();
          const clipboard = event.clipboardData;
          const text = clipboard.getData('Text');
          event.target.value = text.trim();
          this.account.email = text.trim();
        },
        false
      );
    }
  }

  loginWithGoogle() {
    this.googleAuth.redirectToGoogleLogin();
  }
  loginWithLinkedin() {
  this.linkedinAuth.redirectToLinkedinLogin();
}


  public async submit(frm: any) {
    this.submitted = true;

    /**
     * ===================================================
     * STEP 1: SEND OTP (for Expert + Student)
     * ===================================================
     */
    if (this.step === 'email') {
      if (frm.invalid) return;
      if (this.account.type === 'student' && !this.allowPersonalEmail) {
        if (!this.isCompanyEmail(this.account.email)) {
          return this.appService.toastError('Please use company email domain or click Sign Up below');
        }
      }

      const payload = {
        email: this.account.email.toLowerCase(),
        type: this.account.type
      };

      return this.auth
        .sendOtp(payload)
        .then(() => {
          this.appService.toastSuccess('A verification code has been sent to your email.');
          this.step = 'otp';
        })
        .catch((err) => this.appService.toastError(err));
    }

    /**
     * ===================================================
     * STEP 2: VERIFY OTP (auto-register + auto-login)
     * ===================================================
     */
    if (this.step === 'otp') {
      if (!this.otpToken.trim()) {
        return this.appService.toastError('Please enter OTP');
      }

      const payload = {
        email: this.account.email.toLowerCase(),
        otp: this.otpToken.trim()
      };

      return this.auth
        .verifyOtp(payload)
        .then(() => this.auth.getCurrentUser())
        .then((user: any) => {
          if (!user) return;
          this.step = 'createPassword';
          this.appService.toastSuccess('Verified. Create a new password');
        })
        .catch((err) => this.appService.toastError(err));
    }

    if (this.step === 'createPassword') {
      if (!this.newPassword || this.newPassword.length < 6) {
        return this.appService.toastError('Password must be at least 6 characters');
      }
      if (this.newPassword !== this.confirmPassword) {
        return this.appService.toastError('Confirm password does not match');
      }
      return this.userService
        .updateMe({ password: this.newPassword })
        .then(() => this.auth.getCurrentUser())
        .then((user: any) => {
          this.appService.toastSuccess('Password set successfully');
          if (user && user.type === 'tutor') {
            this.step = 'tutorProfile';
          } else {
            this.step = 'personalInfo';
          }
        })
        .catch((err: any) => this.appService.toastError(err));
    }
    if (this.step === 'personalInfo') {
      const name = (this.studentProfile.name || '').trim();
      const phoneNumber = (this.studentProfile.phoneNumber || '').trim();
      const address = (this.studentProfile.address || '').trim();
      if (!name || !phoneNumber || !address) {
        return this.appService.toastError('Please fill name, phone number and address');
      }
      return this.userService
        .updateMe({ name, phoneNumber, address })
        .then(() => {
          this.appService.toastSuccess('Profile details saved');
          this.router.navigate(['/users/dashboard']);
        })
        .catch((err: any) => this.appService.toastError(err));
    }
    if (this.step === 'tutorProfile') {
      const highlights = (this.tutorProfile.highlightsText || '')
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => !!s);
      const workHistory = (this.tutorProfile.workHistoryText || '')
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => !!s);
      const consultationFee = Number(this.tutorProfile.consultationFee || 0);
      const yearsExperience = Number(this.tutorProfile.yearsExperience || 0);

      if (!highlights.length || !workHistory.length || consultationFee <= 0) {
        return this.appService.toastError('Please fill highlights, work history and fee.');
      }

      return this.tutorService
        .update({
          highlights,
          workHistory,
          consultationFee,
          yearsExperience
        })
        .then(() => {
          this.appService.toastSuccess('Profile submitted. Pending admin approval.');
          this.router.navigate(['/users/dashboard']);
        })
        .catch((err) => this.appService.toastError(err));
    }
  }

  isCompanyEmail(email: string): boolean {
    const at = email.indexOf('@');
    if (at === -1) return false;
    const domain = email.slice(at + 1).toLowerCase();
    if (!domain || domain.indexOf('.') === -1) return false;
    const personal = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'live.com',
      'icloud.com',
      'aol.com',
      'protonmail.com',
      'zoho.com',
      'yandex.com',
      'mail.com',
      'gmx.com'
    ];
    return personal.indexOf(domain) === -1;
  }
}
