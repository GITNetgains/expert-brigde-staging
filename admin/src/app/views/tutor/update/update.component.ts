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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProfileCardComponent } from '../../user/profile-card/profile-card.component';
import { TutorCategoriesComponent } from '../tutor-categories/tutor-categories.component';
import { TutorEducationComponent } from '../tutor-education/tutor-education.component';
import { ReviewTutorComponent } from '../../reviews/list/list.component';
import { EditorComponent } from 'src/components/common/editor/editor.component';
import { tz } from 'moment-timezone';
import { NgSelectModule } from '@ng-select/ng-select';
import { TimezoneComponent } from '../timezone.component';
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
  ],
})
export class UpdateComponent implements OnInit {
  public info: IUser = {} as IUser;
  public isSubmitted = false;
  public loading = false;
  public userId: string | null = null;
  public isTimezoneValid = true;
  public urlYoutube: SafeResourceUrl | null = null;
  public customStylesValidated = false;
  public countries: any[] = [];
  public timezones: any[] = [];
  public languages: any[] = [];
  public skills: any[] = [];
  public industries: any[] = [];
  public newWorkPosition = '';
  public newWorkCompany = '';
  public newWorkYears = '';

  @Output() afterReject = new EventEmitter<any>();

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private tutorService = inject(TutorService);
  private utilService = inject(UtilService);
  private sanitizer = inject(DomSanitizer);
  private countryService = inject(CountryService);
  private languageService = inject(LanguageService);
  private industryService = inject(IndustryService);

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
        if (this.info.introYoutubeId) {
          this.urlYoutube = this.setUrl(this.info.introYoutubeId);
        }

        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.utilService.toastError({
          title: 'Error',
          message: 'Failed to load tutor data',
        });
      },
    });
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
      idYoutube: this.info.idYoutube,
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
      workHistory: this.info.workHistory,
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
          message: 'Tutor updated successfully!',
        });
        this.router.navigate(['/tutor/list']);
      },
      error: (err) => {
        this.loading = false;
        this.utilService.toastError({
          title: 'Error',
          message: err.error?.message || 'Failed to update tutor',
        });
      },
    });
  }

  afterUpload(evt: string) {
    this.info.avatar = evt;
  }

  addWorkHistory() {
    const position = this.newWorkPosition.trim();
    const company = this.newWorkCompany.trim();
    const years = this.newWorkYears.trim();

    if (!position && !company && !years) {
      return;
    }

    let entry = position;
    if (company) {
      entry = entry ? `${entry}, ${company}` : company;
    }
    if (years) {
      entry = entry ? `${entry} (${years})` : `(${years})`;
    }

    if (!this.info.workHistory) {
      this.info.workHistory = [];
    }

    this.info.workHistory.push(entry);
    this.newWorkPosition = '';
    this.newWorkCompany = '';
    this.newWorkYears = '';
  }

  removeWorkHistory(index: number) {
    if (!this.info.workHistory) {
      return;
    }
    this.info.workHistory.splice(index, 1);
  }

  setUrl(idYoutube: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${idYoutube}`
    );
  }

  approve() {
    if (confirm('Are you sure you want to approve this tutor?')) {
      this.tutorService.approve(this.userId as string).subscribe({
        next: (resp) => {
          this.info.rejected = false;
          this.info.pendingApprove = false;
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'Tutor approved successfully!',
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
                  message: 'Tutor approved successfully!',
                });
              } else {
                this.utilService.toastError({
                  title: 'Error',
                  message: 'Failed to approve tutor',
                });
              }
            },
            error: () => {
              this.utilService.toastError({
                title: 'Error',
                message: 'Failed to approve tutor',
              });
            },
          });
        },
      });
    }
  }
  reject() {
    const reason = prompt('Why do you want to reject this tutor?');
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
          message: 'Tutor rejected successfully!',
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
                message: 'Tutor rejected successfully!',
              });
            } else {
              this.utilService.toastError({
                title: 'Error',
                message: 'Failed to reject tutor',
              });
            }
          },
          error: () => {
            this.utilService.toastError({
              title: 'Error',
              message: 'Failed to reject tutor',
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
          ? 'Tutor activated'
          : 'Tutor deactivated';
        this.utilService.toastSuccess({
          title: 'Success',
          message: message,
        });
      },
      error: (err) => {
        this.utilService.toastError({
          title: 'Error',
          message: 'Failed to change tutor status',
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
