import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  TutorService,
  UtilService,
  CountryService,
  LanguageService,
  IndustryService,
} from 'src/services';
import { ProfileCardComponent } from '../../user/profile-card/profile-card.component';
import { TutorCategoriesComponent } from '../tutor-categories/tutor-categories.component';
import { TutorEducationComponent } from '../tutor-education/tutor-education.component';
import { ReviewTutorComponent } from '../../reviews/list/list.component';
import { EditorComponent } from 'src/components/common/editor/editor.component';
import { tz } from 'moment-timezone';
import { NgSelectModule } from '@ng-select/ng-select';
import { TimezoneComponent } from '../timezone.component';
import { FileUploadComponent } from 'src/components/common/uploader/uploader.component';
import { environment } from 'src/environments/environment';
import { videoMimeTypes } from 'src/constants';
import {
  ButtonDirective,
  CardComponent,
  CardBodyComponent,
  ColComponent,
  ContainerComponent,
  FormControlDirective,
  FormDirective,
  FormLabelDirective,
  FormFeedbackComponent,
  CardHeaderComponent,
  RowComponent,
  Tabs2Module,
  TabsModule,
  TabsComponent,
  InputGroupComponent,
  GutterDirective,
} from '@coreui/angular';
import { IUser } from 'src/interfaces';

@Component({
  selector: 'app-tutor-update',
  templateUrl: '../form.component.html',
  standalone: true,
  imports: [
    ButtonDirective,
    CommonModule,
    ColComponent,
    CardComponent,
    CardBodyComponent,
    ContainerComponent,
    CardHeaderComponent,
    FormsModule,
    FormDirective,
    FormLabelDirective,
    FormFeedbackComponent,
    FormControlDirective,
    RowComponent,
    ProfileCardComponent,
    TutorCategoriesComponent,
    NgSelectModule,
    Tabs2Module,
    TabsModule,
    TabsComponent,
    InputGroupComponent,
    TutorEducationComponent,
    ReviewTutorComponent,
    EditorComponent,
    GutterDirective,
    TimezoneComponent,
  FileUploadComponent,
  ],
})
export class UpdateComponent implements OnInit {
  public info: IUser = {} as IUser;
  public isSubmitted = false;
  public loading = false;
  public userId: string | null = null;
  public isTimezoneValid = true;
  public customStylesValidated = false;
  public countries: any[] = [];
  public timezones: any[] = [];
  public languages: any[] = [];
  public skills: any[] = [];
  public industries: any[] = [];
  @Output() afterReject = new EventEmitter<any>();
  public introVideoOptions: any;
  public introVideoUrl: string = '';
  public uploadingIntroVideo = false;
  public maxFileSize: number = 1024;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private tutorService = inject(TutorService);
  private utilService = inject(UtilService);
  private countryService = inject(CountryService);
  private languageService = inject(LanguageService);
  private industryService = inject(IndustryService);

  /** Filter countries by name starting with search term (e.g. type "i" → India, Iceland) */
  countrySearchFn = (term: string, item: any) => {
    if (!term || !item?.name) return true;
    return item.name.toLowerCase().startsWith(term.toLowerCase());
  };

  ngOnInit() {
    this.countries = this.countryService.countries;
    this.timezones = tz.names();
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.loadTutorData();
    }
    this.languages = this.languageService.getLang().map((lang) => ({
      code: lang.id,
      name: lang.name,
    }));

    this.tutorService.getSkills({ take: 100 }).subscribe({
      next: (resp) => {
        this.skills = resp.data.items || [];
      },
      error: () => {}
    });

    this.industryService.search({ take: 100 }).subscribe({
      next: (resp) => {
        this.industries = resp.data.items || [];
      },
      error: () => {}
    });

    this.setupIntroVideoUploadOptions();
  }

  loadTutorData() {
    this.loading = true;

    this.tutorService.findOne(this.userId as string).subscribe({
      next: (resp) => {
        this.info = resp.data;
        if (!this.info.issueDocument) this.info.issueDocument = '';
        if (!this.info.resumeDocument) this.info.resumeDocument = '';
        if (!this.info.certificationDocument)
          this.info.certificationDocument = '';

        if (this.info.country && typeof this.info.country === 'object') {
          this.info.country = this.info.country.code;
        }
        if (this.info.introVideo && (this.info.introVideo as any).fileUrl) {
          this.introVideoUrl = (this.info.introVideo as any).fileUrl;
        }

        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.utilService.toastError({
          title: 'Error',
          message: 'Failed to load expert data',
        });
      },
    });
  }

  setupIntroVideoUploadOptions() {
    this.introVideoOptions = {
      url: `${environment.apiUrl}/media/videos`,
      fileFieldName: 'file',
      id: 'tutor-intro-video-upload',
      autoUpload: false,
      multiple: false,
      maxFileSize: this.maxFileSize * 1024 * 1024,
      allowedMimeType: videoMimeTypes,
      uploadZone: true,
      hintText: 'Upload introduction video',
      onProgressItem: (_fileItem: any, _progress: number) => {
        this.uploadingIntroVideo = true;
      },
      onCompleteItem: (_item: any, response: any) => {
        try {
          const parsedResponse =
            typeof response === 'string' ? JSON.parse(response) : response;
          if (parsedResponse && parsedResponse.data) {
            this.info.introVideoId = parsedResponse.data._id;
            this.introVideoUrl = parsedResponse.data.fileUrl;
            (this.info as any).introVideo = parsedResponse.data;
          }
        } catch (e) {
          this.utilService.toastError({
            title: 'Error',
            message: 'Failed to process intro video upload response',
          });
        } finally {
          this.uploadingIntroVideo = false;
        }
      },
    };
  }

  submit(form: any) {
    this.isSubmitted = true;
    this.customStylesValidated = true;
    if (!form.valid || !this.isTimezoneValid) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Please check the form and try again!',
      });
      return;
    }
    if (
      this.info.commissionRate !== undefined &&
      (this.info.commissionRate < 0 || this.info.commissionRate > 1)
    ) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Commission rate must be between 0 and 1',
      });
      return;
    }

    const selectedCountry = this.countries.find(
      (c) => c.code === this.info.country
    );

    const data = {
      name: this.info.name,
      username: this.info.username,
      email: this.info.email,
      bio: this.info.bio,
      isActive: this.info.isActive,
      emailVerified: this.info.emailVerified,
      phoneVerified: this.info.phoneVerified,
      showPublicIdOnly: this.info.showPublicIdOnly,
      address: this.info.address,
      phoneNumber: this.info.phoneNumber,
      zipCode: this.info.zipCode,
      commissionRate: this.info.commissionRate,
      idYoutube: '',
      introVideoId: this.info.introVideoId,
      featured: this.info.featured,
      isHomePage: this.info.isHomePage,
      password: this.info.password,
      city: this.info.city,
      state: this.info.state,
      country: {
        code: this.info.country,
        name: selectedCountry ? selectedCountry.name : '',
      },
      timezone: this.info.timezone,
      languages: this.info.languages,
      skillIds: this.info.skillIds,
      industryIds: this.info.industryIds,
      highlights: this.info.highlights,
      yearsExperience: this.info.yearsExperience,
      consultationFee: this.info.consultationFee,
      avatar: this.info.avatar,
    };

    this.loading = true;
    this.tutorService.update(this.userId as string, data).subscribe({
      next: (resp) => {
        this.loading = false;
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'Expert updated successfully!',
        });
        this.router.navigate(['/tutor/list']);
      },
      error: (err) => {
        this.loading = false;
        this.utilService.toastError({
          title: 'Error',
          message: err.error?.message || 'Failed to update expert',
        });
      },
    });
  }

  afterUpload(evt: string) {
    this.info.avatar = evt;
  }

  approve() {
    if (confirm('Are you sure you want to approve this expert?')) {
      this.tutorService.approve(this.userId as string).subscribe({
        next: (resp) => {
          this.info.rejected = false;
          this.info.pendingApprove = false;
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'Expert approved successfully!',
          });
        },
        error: () => {
          this.tutorService.findOne(this.userId as string).subscribe({
            next: (resp2) => {
              this.info = resp2.data;
              const ok = !this.info.pendingApprove && !this.info.rejected;
              if (ok) {
                this.utilService.toastSuccess({
                  title: 'Success',
                  message: 'Expert approved successfully!',
                });
              } else {
                this.utilService.toastError({
                  title: 'Error',
                  message: 'Failed to approve expert',
                });
              }
            },
            error: () => {
              this.utilService.toastError({
                title: 'Error',
                message: 'Failed to approve expert',
              });
            },
          });
        },
      });
    }
  }
  reject() {
    const reason = prompt('Why do you want to reject this expert?');
    if (!reason) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Please provide a reason for rejection',
      });
      return;
    }

    this.tutorService.reject(this.userId as string, { reason }).subscribe({
      next: (resp) => {
        this.info.rejected = true;
        this.info.pendingApprove = false;
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'Expert rejected successfully!',
        });
        this.afterReject.emit(resp.data);
      },
      error: () => {
        this.tutorService.findOne(this.userId as string).subscribe({
          next: (resp2) => {
            this.info = resp2.data;
            const ok = !this.info.pendingApprove && this.info.rejected;
            if (ok) {
              this.utilService.toastSuccess({
                title: 'Success',
                message: 'Expert rejected successfully!',
              });
            } else {
              this.utilService.toastError({
                title: 'Error',
                message: 'Failed to reject expert',
              });
            }
          },
          error: () => {
            this.utilService.toastError({
              title: 'Error',
              message: 'Failed to reject expert',
            });
          },
        });
      },
    });
  }

  changeStatus() {
    this.tutorService.changeStatus(this.userId as string).subscribe({
      next: (resp) => {
        if (this.info.isActive !== undefined) {
          this.info.isActive = !this.info.isActive;
        }
        const message = this.info.isActive
          ? 'Expert activated'
          : 'Expert deactivated';
        this.utilService.toastSuccess({
          title: 'Success',
          message: message,
        });
      },
      error: (err) => {
        this.utilService.toastError({
          title: 'Error',
          message: 'Failed to change expert status',
        });
      },
    });
  }

  changeTimezone(timezone: string) {
    this.info.timezone = timezone;
  }

  inviteTutorJoinZoom() {
    this.tutorService.inviteZoom(this.info.email).subscribe({
      next: (resp) => {
        console.log(resp);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  isDoc(document: any): boolean {
    if (!document || !document.mimeType) return false;
    return (
      document.mimeType.includes('pdf') ||
      document.mimeType.includes('doc') ||
      document.mimeType.includes('docx') ||
      document.mimeType.includes('application')
    );
  }

  showDocument(document: any) {
    if (document && document.fileUrl) {
      window.open(document.fileUrl, '_blank');
    }
  }

  onTimezoneValidationChange(isValid: boolean) {
    this.isTimezoneValid = isValid;
  }
}
