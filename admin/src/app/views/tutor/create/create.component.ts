import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  TutorService,
  UtilService,
  CountryService,
  LanguageService,
  IndustryService,
} from 'src/services';
import { ProfileCardComponent } from '../../user/profile-card/profile-card.component';
import { tz } from 'moment-timezone';
import { IUser } from 'src/interfaces';
import { NgSelectModule } from '@ng-select/ng-select';
import { TimezoneComponent } from '../timezone.component';
import {
  ButtonDirective,
  CardComponent,
  ContainerComponent,
  InputGroupComponent,
  CardBodyComponent,
  CardHeaderComponent,
  FormControlDirective,
  FormDirective,
  FormLabelDirective,
  FormFeedbackComponent,
  RowComponent,
  ColComponent,
  Tabs2Module,
  TabsModule,
  TabsComponent,
  GutterDirective,
} from '@coreui/angular';
import { TutorCategoriesComponent } from '../tutor-categories/tutor-categories.component';
import { TutorEducationComponent } from '../tutor-education/tutor-education.component';
import { ReviewTutorComponent } from '../../reviews/list/list.component';
import { EditorComponent } from 'src/components/common/editor/editor.component';

@Component({
  selector: 'app-tutor-create',
  templateUrl: '../form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonDirective,
    CardComponent,
    ContainerComponent,
    InputGroupComponent,
    CardHeaderComponent,
    CardBodyComponent,
    FormControlDirective,
    FormDirective,
    FormLabelDirective,
    FormFeedbackComponent,
    RowComponent,
    ColComponent,
    ProfileCardComponent,
    NgSelectModule,
    Tabs2Module,
    TabsModule,
    TabsComponent,
    TutorCategoriesComponent,
    TutorEducationComponent,
    ReviewTutorComponent,
    EditorComponent,
    GutterDirective,
    TimezoneComponent,
  ],
})
export class CreateComponent implements OnInit {
  public skills: any[] = [];
  public industries: any[] = [];
  public info: IUser = {
    _id: '',
    type: 'tutor',
    name: '',
    username: '',
    email: '',
    address: '',
    phoneNumber: '',
    role: 'user',
    isActive: false,
    emailVerified: false,
    avatarUrl: '',
    avatar: '',
    password: '',
    commissionRate: 0,
    zipCode: '',
    bio: '',
    idYoutube: '',
    featured: false,
    isHomePage: false,
    city: '',
    state: '',
    country: null,
    timezone: '',
    languages: [],
    skillIds: [],
    industryIds: [],
    highlights: [],
    workHistory: [],
  };
  public isSubmitted = false;
  public loading = false;
  public userId: string | null = null;
  public customStylesValidated = false;
  public isTimezoneValid = true;
  public countries: any[] = [];
  public timezones: any[] = [];
  public languages: any[] = [];
  public newWorkPosition = '';
  public newWorkCompany = '';
  public newWorkYears = '';

  private router = inject(Router);
  private tutorService = inject(TutorService);
  private utilService = inject(UtilService);
  private countryService = inject(CountryService);
  private languageService = inject(LanguageService);
  private industryService = inject(IndustryService);
  ngOnInit() {
    this.countries = this.countryService.countries;
    this.timezones = tz.names();

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
      this.info.commissionRate &&
      (this.info.commissionRate < 0 || this.info.commissionRate > 1)
    ) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Commission rate must be between 0 and 1',
      });
      return;
    }

    const selectedCountry = this.info.country
      ? this.countries.find((country) => country.code === this.info.country)
      : null;

    const data = {
      name: this.info.name,
      username: this.info.username,
      email: this.info.email,
      isActive: this.info.isActive,
      emailVerified: this.info.emailVerified,
      address: this.info.address,
      password: this.info.password,
      phoneNumber: this.info.phoneNumber,
      avatar: this.info.avatar,
      commissionRate: this.info.commissionRate,
      yearsExperience: this.info.yearsExperience,
      consultationFee: this.info.consultationFee,
      zipCode: this.info.zipCode,
      bio: this.info.bio,
      skillIds: this.info.skillIds,
      industryIds: this.info.industryIds,
      highlights: this.info.highlights,
      workHistory: this.info.workHistory,
      idYoutube: this.info.idYoutube,
      featured: this.info.featured,
      isHomePage: this.info.isHomePage,
      city: this.info.city,
      state: this.info.state,
      country: selectedCountry,
      languages: this.info.languages,
      timezone: this.info.timezone
    };

    this.loading = true;
    this.tutorService.create(data).subscribe({
      next: (resp) => {
        this.loading = false;
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'Tutor created successfully!',
        });
        this.router.navigate(['/tutor/list']);
      },
      error: (err) => {
        this.loading = false;
        if (
          err.error?.message === 'An error occurred, please try again!' &&
          err.status === 400 &&
          this.info.email
        ) {
          this.utilService.toastError({
            title: 'Email Already Exists',
            message: `The email "${this.info.email}" is already registered in the system. Please use a different email address.`,
          });
        } else {
          this.utilService.toastError({
            title: 'Error',
            message: err.error?.message || 'Failed to create tutor',
          });
        }
      },
    });
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

  afterUpload(evt: string) {
    this.info.avatar = evt;
  }

  onTimezoneValidationChange(isValid: boolean) {
    this.isTimezoneValid = isValid;
  }
}
