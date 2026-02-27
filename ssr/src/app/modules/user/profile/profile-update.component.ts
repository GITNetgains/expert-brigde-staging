import {
  Component,
  OnInit,
  ViewChild,
  Output,
  EventEmitter
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';
import { NgSelectComponent } from '@ng-select/ng-select';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IMyCourse, IMySubject, ISubject, IUser } from 'src/app/interface';
import {
  AppService,
  AuthService,
  CountryService,
  GradeService,
  LanguageService,
  SkillService,
  IndustryService,
  MyCourseService,
  MySubjectService,
  STATE,
  SeoService,
  StateService,
  TutorService,
  UserService,
  UtilService
} from 'src/app/services';
import { environment } from 'src/environments/environment';
import { IResponse } from 'src/app/services/api-request';
import { AvatarUploadComponent } from 'src/app/components/media/avatar-upload/avatar-upload.component';
import { MyCertificateComponent } from 'src/app/components/user/my-certificate-modal/my-certificate.component';
import { AddCetificationComponent } from 'src/app/components/tutor/certificate/add-certification/add-certification.component';
import { quillConfig } from 'src/app/lib';

type tplotOptions = {
  [key: string]: any;
};
@Component({
  selector: 'app-profile-update',
  templateUrl: './form.html',
  styleUrls: ['./profile-update.component.scss']
})
export class ProfileUpdateComponent implements OnInit {
  @ViewChild('language') ngSelectComponent: NgSelectComponent;
  @ViewChild('frmInvite') frmInvite: NgForm;
  public info: IUser;
  public avatarUrl = '';
  public checkAvatar: boolean;
  public isSubmitted = false;
  public avatarOptions: any = {};
  private userId: string;
  public config: any;
  public uploading = false;

  @Output() afterCancel = new EventEmitter();
  public isEditProfile = false;
  public isEditDescription = false;
  public isEditGrade = false;
  public isEditSubject = false;
  public isEditSkill = false;
  public isEditIndustry = false;

  public countries: any;
  public languages: any;
  public languageNames: any = [];
  public objectLanguage: any = {};

  public gradeNames: any = [];
  public grades: any;
  public totalUserGrades = 0;

  public subjects: ISubject[] = [];
  public tutorSubjects: IMySubject[] = [];
  public skills: any[] = [];
  public skillNames: string[] = [];
  public industries: any[] = [];
  public industryNames: string[] = [];
  public addSkillLoading = false;

  public emailInvite = '';

  public timezone: any;
  public loading = false;
  public showChar = 500;
  public showMore = false;

  public webUrl: string;
  public myCompletedCourses: IMyCourse[] = [];

  public introVideoType = 'upload';
  public introVideoOptions: any;
  public introVideo: any;
  public introVideoName = '';

  public quillConfig = quillConfig;
  banner = 'url(assets/images/dashboard/bg-profile.svg)';
  active = 1;
  public states: string[] = [];

  /** Send CV webhook (profile dashboard): upload then submit */
  public cvWebhookName = '';
  public cvWebhookUrl = '';
  public cvWebhookDocUploadUrl = '';
  /** Media ID of uploaded CV so we can also save it as resumeDocument for the tutor */
  public cvWebhookMediaId = '';
  public sendCvWebhookLoading = false;
  public get yearsExperienceProxy(): number {
    return (this.info as any)?.yearsExperience ?? 0;
  }
  public set yearsExperienceProxy(val: number) {
    if (this.info) (this.info as any).yearsExperience = val;
  }
  public get consultationFeeProxy(): number {
    return (this.info as any)?.consultationFee ?? 0;
  }
  public set consultationFeeProxy(val: number) {
    if (this.info) (this.info as any).consultationFee = val;
  }
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private route: ActivatedRoute,
    private seoService: SeoService,
    private tutorService: TutorService,
    private gradeService: GradeService,
    private languageService: LanguageService,
    private skillService: SkillService,
    private industryService: IndustryService,
    private countryService: CountryService,
    private utilService: UtilService,
    private modalService: NgbModal,
    private mySubjectService: MySubjectService,
    private myCourseService: MyCourseService,
    private appService: AppService,
    private stateService: StateService
  ) {
    this.subjects = this.route.snapshot.data['subjects'];
    this.seoService.setMetaTitle('Profile');
    this.webUrl = environment.url;
  }

  async ngOnInit() {
    this.config = this.stateService.getState(STATE.CONFIG);
    if (this.config && this.config.profileBanner) {
      this.banner = `url(${this.config.profileBanner})`;
    }
    this.loading = true;
    this.countries = this.countryService.getCountry();
    this.languages = this.languageService.getLang();
    this.objectLanguage = this.languageService.languages;
    this.avatarOptions = {
      url: environment.apiBaseUrl + '/users/avatar',
      fileFieldName: 'avatar',
      onFinish: (resp: IResponse<any>) => {
        this.avatarUrl = resp.data.url;
      }
    };

    this.introVideoOptions = {
      url: environment.apiBaseUrl + '/tutors/upload-introVideo',
      fileFieldName: 'file',
      uploadOnSelect: true,
      onFinish: (resp: any) => {
        const d = resp && (resp.data || resp);
        if (d) {
          this.info.introVideoId = d._id || d.id;
          this.introVideoName = d.name || (d.originalName || '');
        }
        this.uploading = false;
      },
      onFileSelect: (resp: any) => (this.introVideo = resp && resp[0] && resp[0].file),
      id: 'id-introVideo',
      accept: 'video/*',
      onUploading: () => (this.uploading = true)
    };

    await this.userService.me().then((resp: IResponse<any>) => {
      this.info = resp.data;
      if (this.info && this.info.bio && this.info.bio.length > this.showChar) {
        this.showMore = true;
      }
      if (this.info && this.info.type === 'tutor') {
        this.cvWebhookName = this.info.name || '';
        this.cvWebhookDocUploadUrl = environment.apiBaseUrl + '/tutors/upload-document';
      }

      if (this.info.type === 'tutor') {
        this.introVideoType = 'upload';
      }

      if (this.info.introVideo) {
        this.introVideoName = this.info.introVideo.name;
      }

      const params = {
        tutorId: this.info._id
      };
      this.mySubjectService.search(params).then((res: IResponse<any>) => {
        this.tutorSubjects = res.data.items;
      });
      this.userId = this.info._id;

      this.avatarUrl = resp.data.avatarUrl;
      if (this.avatarUrl !== '/assets/images/default-avatar.jpg' && this.avatarUrl !== 'http://localhost:9000/assets/default-avatar.jpg')
        this.checkAvatar = true;
      this.updateStates();
    });

    await this.myCourseService
      .search({ isCompleted: true, sort: 'completedAt', sortType: 'desc' })
      .then((resp) => {
        this.myCompletedCourses = resp.data.items;
      });

    await this.gradeService
      .search({
        take: 100,
        sort: 'ordering',
        sortType: 'asc'
      })
      .then((resp) => {
        this.grades = resp.data.items;
      });
    this.mapGradeName(this.info.grades);
    this.mapLanguageName(this.info.languages);
    await this.skillService
      .search({ take: 1000, sort: 'ordering', sortType: 'asc' })
      .then((resp) => {
        this.skills = resp.data.items || [];
      })
      .catch(() => this.appService.toastError());

    await this.industryService
      .search({ take: 1000, sort: 'ordering', sortType: 'asc' })
      .then((resp) => {
        this.industries = resp.data.items || [];
      })
      .catch(() => this.appService.toastError());

    // Initialize skillIds and skillNames (API may return skills populated or just skillIds)
    const rawSkillIds = (this.info as any).skillIds;
    const rawSkills = (this.info as any).skills;
    if (Array.isArray(rawSkills) && rawSkills.length) {
      (this.info as any).skillIds = rawSkills.map((s: any) => s._id || s.id);
      this.skillNames = rawSkills.map((s: any) => s.name);
    } else if (Array.isArray(rawSkillIds) && rawSkillIds.length) {
      (this.info as any).skillIds = rawSkillIds.map((id: any) => (typeof id === 'string' ? id : id?.toString?.() || id));
      const skillIdSet = new Set((this.info as any).skillIds);
      this.skillNames = (this.skills || []).filter((s: any) => skillIdSet.has(String(s._id))).map((s: any) => s.name);
    } else {
      (this.info as any).skillIds = (this.info as any).skillIds || [];
    }

    // Initialize industryIds and industryNames
    const rawIndustryIds = (this.info as any).industryIds;
    const rawIndustries = (this.info as any).industries;
    if (Array.isArray(rawIndustries) && rawIndustries.length) {
      (this.info as any).industryIds = rawIndustries.map((i: any) => i._id || i.id);
      this.industryNames = rawIndustries.map((i: any) => i.name);
    } else if (Array.isArray(rawIndustryIds) && rawIndustryIds.length) {
      (this.info as any).industryIds = rawIndustryIds.map((id: any) => (typeof id === 'string' ? id : id?.toString?.() || id));
      const industryIdSet = new Set((this.info as any).industryIds);
      this.industryNames = (this.industries || []).filter((i: any) => industryIdSet.has(String(i._id))).map((i: any) => i.name);
    } else {
      (this.info as any).industryIds = (this.info as any).industryIds || [];
    }

    this.loading = false;
  }

  mapGradeName(gradeKeys: any) {
    this.grades.forEach((key: any) => {
      if (gradeKeys.indexOf(key.id) > -1) {
        this.gradeNames.push(key.name);
      }
    });

    this.totalUserGrades = this.gradeNames.length;
    if (this.totalUserGrades > 4) this.gradeNames = _.chunk(this.gradeNames);
  }
  mapLanguageName(languageKeys: any) {
    languageKeys.forEach((key: string) => {
      this.languageNames.push(this.objectLanguage[key]);
    });
  }

  onIntroVideoUploadFinish(items: any[]) {
    if (items && items.length) {
      const body = items[0];
      const d = body && (body.data || body);
      if (d) {
        this.info.introVideoId = d._id || d.id;
        this.introVideoName = d.name || (d.originalName || '');
      }
    }
  }

  changeTimezone(event: any) {
    if (event === 'Asia/Saigon') {
      this.info.timezone = 'Asia/Ho_Chi_Minh';
    } else {
      this.info.timezone = event;
    }
  }

  updateStates() {
    const country = this.info?.country;
    let code = (this.info as any)?.countryCode || (country && (country as any).code) || '';
    if (!code && country && (country as any).name) {
      const found = this.countryService.getCountryByName((country as any).name);
      code = (found && found.code) ? found.code : '';
    }
    code = (code || '').toString().trim().toUpperCase();
    this.states = this.countryService.getStates(code) || [];
  }

  /** Filter countries by name starting with search term (e.g. type "i" → India, Iceland) */
  countrySearchFn = (term: string, item: any) => {
    if (!term || !item?.name) return true;
    return item.name.toLowerCase().startsWith(term.toLowerCase());
  };

  onCountryChange(country: any) {
    if (country) {
      (this.info as any).country = country;
      (this.info as any).countryCode = country.code;
      this.updateStates();
      if (this.states.length && this.states.indexOf((this.info as any).state) === -1) {
        (this.info as any).state = '' as any;
      }
    }
  }

  submit(frm: any, isSubmitForm = true) {
    if (isSubmitForm) {
      this.isSubmitted = true;
      if (this.info.type === 'tutor') {
        this.info.introYoutubeId = '';
        (this.info as any).idYoutube = '';
      }

      if (!frm.valid || !this.info.timezone) {
        return this.appService.toastError(
          'Form is invalid, please check again.'
        );
      }
      this.isEditProfile = false;
      this.isEditDescription = false;
    }

    if (this.info.type === 'tutor') {
      const data = _.pick(this.info, [
        'name',
        'username',
        'subjectIds',
        'skillIds',
        'industryIds',
        'bio',
        'email',
        'address',
        'phoneNumber',
        'grades',
        'languages',
        'yearsExperience',
        'consultationFee',
        'password',
        'timezone',
        'gender',
        'zipCode',
        'price1On1Class',
        'country',
        'city',
        'state',
        'introVideoId',
        'defaultSlotDuration',
        'paypalEmailId',
        'highlights'
      ]);

      if (Array.isArray((data as any).skillIds) && !(data as any).skillIds.length) {
        delete (data as any).skillIds;
      }
      if (Array.isArray((data as any).industryIds) && !(data as any).industryIds.length) {
        delete (data as any).industryIds;
      }

      return this.tutorService
        .update(data)
        .then((resp) => {
          this.info.password = '';
          this.info = _.merge(resp.data, this.info);
          this.languageNames = [];
          this.mapLanguageName(this.info.languages);
          this.gradeNames = [];
          this.mapGradeName(this.info.grades);
          // Refresh skillNames and industryNames from saved skillIds/industryIds
          this.skillNames = [];
          this.industryNames = [];
          const skillIds = (this.info as any).skillIds || [];
          const industryIds = (this.info as any).industryIds || [];
          if (skillIds.length) {
            const skillIdSet = new Set(skillIds.map((id: any) => String(id)));
            this.skillNames = (this.skills || []).filter((s: any) => skillIdSet.has(String(s._id))).map((s: any) => s.name);
          }
          if (industryIds.length) {
            const industryIdSet = new Set(industryIds.map((id: any) => String(id)));
            this.industryNames = (this.industries || []).filter((i: any) => industryIdSet.has(String(i._id))).map((i: any) => i.name);
          }
          this.isEditSkill = false;
          this.isEditIndustry = false;
          this.appService.toastSuccess('Profile updated successfully!');
          this.utilService.notifyEvent('profileUpdate', this.info);
          this.authService.updateCurrentUser(this.info);
          localStorage.setItem('timeZone', this.info.timezone);
          this.stateService.saveState(STATE.CURRENT_USER, this.info);
        })
        .catch((err: any) => this.appService.toastError(err));
    }

    return this.userService
      .updateMe(this.info)
      .then((resp: IResponse<any>) => {
        this.info.password = '';
        this.info = _.merge(resp.data, this.info);
        this.appService.toastSuccess('Updated successfully!');
        this.utilService.notifyEvent('profileUpdate', this.info);
        localStorage.setItem('timeZone', this.info.timezone);
        this.stateService.saveState(STATE.CURRENT_USER, this.info);
      })
      .catch((err: any) => this.appService.toastError(err));
  }

  changeNotification() {
    this.info.notificationSettings = !this.info.notificationSettings;

    const data = _.pick(this.info, ['notificationSettings']);
    this.userService
      .updateMe(data)
      .then((resp: IResponse<any>) => {
        this.info = _.merge(resp.data, this.info);
        if (this.info.notificationSettings === true) {
          this.appService.toastSuccess('Notification activated successfully!');
        }
        if (this.info.notificationSettings === false) {
          this.appService.toastSuccess(
            'Notification deactivated successfully!'
          );
        }
      })
      .catch((err: any) => this.appService.toastError(err));
  }

  changeShowPublicIdOnly() {
    (this.info as any).showPublicIdOnly = !(this.info as any).showPublicIdOnly;
    const data = _.pick(this.info as any, ['showPublicIdOnly']);
    this.userService
      .updateMe(data)
      .then((resp: IResponse<any>) => {
        this.info = _.merge(resp.data, this.info);
        if ((this.info as any).showPublicIdOnly) {
          this.appService.toastSuccess('Privacy: showing only your ID to clients');
        } else {
          this.appService.toastSuccess('Privacy: showing personal info to clients');
        }
      })
      .catch((err: any) => this.appService.toastError(err));
  }

  inviteFriend() {
    const email = (this.emailInvite || '').trim();
    if (!email) {
      this.appService.toastError('Email is required');
      return;
    }
    this.userService
      .inviteFriend({ email })
      .then((resp: IResponse<any>) => {
        if (resp.data && resp.data.success) {
          this.emailInvite = '';
          if (this.frmInvite) {
            this.frmInvite.resetForm();
          }
          return this.appService.toastSuccess('Invited Successfully!');
        }
        return this.appService.toastError('Invite fail');
      })
      .catch((err: any) => this.appService.toastError(err));
  }

  /** Extract file URL + media id from upload response (upload-document returns media with fileUrl). */
  onCvWebhookUploadFinish(resps: any): void {
    const item = Array.isArray(resps) ? resps[0] : resps;
    const data = item?.data ?? item?.response?.data ?? item;
    if (!data) {
      this.cvWebhookUrl = '';
      this.cvWebhookMediaId = '';
      return;
    }
    const fileUrl =
      data.fileUrl ||
      (data.filePath && environment.apiBaseUrl
        ? `${environment.apiBaseUrl.replace(/\/v1\/?$/, '').replace(/\/$/, '')}/${(data.filePath + '').replace(
            /^public\/?/,
            ''
          )}`
        : null);
    this.cvWebhookUrl = fileUrl || '';
    this.cvWebhookMediaId = data._id || data.id || '';
  }

  async sendCvWebhook() {
    if (!this.cvWebhookUrl) {
      this.appService.toastError('Please upload your CV / Resume first');
      return;
    }
    this.sendCvWebhookLoading = true;
    try {
      // Also persist this CV as the tutor's resumeDocument if we have the media id
      if (this.cvWebhookMediaId) {
        await this.tutorService.update({ resumeDocument: this.cvWebhookMediaId });
        // update local info snapshot
        (this.info as any).resumeDocument = this.cvWebhookMediaId as any;
      }

      await this.tutorService.sendCvWebhook({
        name: this.cvWebhookName || undefined,
        cv_file_url: this.cvWebhookUrl
      });

      this.appService.toastSuccess(
        'CV submitted successfully. Please allow up to 60 seconds for our system to create or update your expert profile, then click the refresh button on this page to check it.'
      );
    } catch (err: any) {
      this.appService.toastError(err?.message || 'Failed to send CV data');
    } finally {
      this.sendCvWebhookLoading = false;
    }
  }

  /** Small helper to refresh the expert profile page after background processing (e.g. CV import) */
  refreshProfile() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  onChangeLanguage(e: any) {
    this.ngSelectComponent.clearAllText = '';
  }

  onChangeGrade(event: any) {
    this.info.grades = [];
    event.forEach((element: any) => {
      this.info.grades.push(element.id);
    });
    this.submit('', false);
  }

  onChangeSkill(event: any) {
    const ids: string[] = [];
    (Array.isArray(event) ? event : []).forEach((el: any) => {
      if (typeof el === 'string') {
        ids.push(String(el));
      } else if (el && (el._id || el.id)) {
        ids.push(String(el._id || el.id));
      }
    });
    (this.info as any).skillIds = Array.from(new Set(ids.filter(Boolean)));
    this.skillNames = [];
    const idSet = new Set((this.info as any).skillIds.map((id: any) => String(id)));
    (this.skills || [])
      .filter((s: any) => idSet.has(String(s._id)))
      .forEach((s: any) => this.skillNames.push(s.name));
  }

  onChangeIndustry(event: any) {
    const ids: string[] = [];
    (Array.isArray(event) ? event : []).forEach((el: any) => {
      if (typeof el === 'string') {
        ids.push(el);
      } else if (el && (el._id || el.id)) {
        ids.push(el._id || el.id);
      }
    });
    (this.info as any).industryIds = Array.from(new Set(ids.filter(Boolean)));
    this.industryNames = [];
    const idSet = new Set((this.info as any).industryIds);
    (this.industries || [])
      .filter((i: any) => idSet.has(i._id))
      .forEach((i: any) => this.industryNames.push(i.name));
  }

  addSkillTag = async (name: string) => {
    try {
      this.addSkillLoading = true;
      const alias = (name || '').toLowerCase().trim().replace(/\s+/g, '-');
      const existing = (this.skills || []).find(
        (s: any) => s.name?.toLowerCase() === (name || '').toLowerCase() || s.alias === alias
      );
      if (existing) {
        // return existing item to ng-select
        return existing;
      }
      const resp = await this.skillService.create({ name, alias });
      const created = resp?.data;
      if (created) {
        this.skills = [created, ...(this.skills || [])];
        return created;
      }
      return { name } as any;
    } catch (e) {
      this.appService.toastError(e);
      return { name } as any;
    } finally {
      this.addSkillLoading = false;
    }
  };

  openChangeAvatarModal() {
    const modalRef = this.modalService.open(AvatarUploadComponent, {
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.info = this.info;
    modalRef.result.then((res) => {
      this.afterCancel.emit(res);
      this.info.avatarUrl = res;
      this.checkAvatar = true;
    });
  }

  openCertification(type: string, index = 0, certificate = null as any) {
    const modalRef = this.modalService.open(AddCetificationComponent, {
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.tutorId = this.info._id;
    modalRef.componentInstance.certificate = certificate;
    modalRef.componentInstance.type = type || 'education';
    modalRef.result.then((res) => {
      const plotOptions: tplotOptions = this.info;
      if (certificate) {
        plotOptions[type][index] = res;
      } else {
        plotOptions[type].push(res);
      }
      this.info = plotOptions as IUser;
    });
  }

  deleteCer(type: string, index: number, certificate: any = null) {
    if (
      window.confirm('Are you sure to delete this certificate?') &&
      certificate
    ) {
      this.tutorService
        .deleteCertificate(certificate._id)
        .then(() => {
          this.appService.toastSuccess('Deleted certificate successfully');
        })
        .catch((err: any) => {
          this.appService.toastError(err);
        });
    }
  }

  deleteAvatar() {
    if (this.checkAvatar) {
      if (window.confirm('Are you sure to delete your avatar?')) {
        this.userService
          .deleteAvatar()
          .then(() => {
            this.info.avatarUrl =
              'http://localhost:9000/assets/default-avatar.jpg';
            this.appService.toastSuccess('Delete avatar successfully');
            this.checkAvatar = false;
          })
          .catch((err: any) => {
            this.appService.toastError(err);
          });
      }
    } else {
      this.appService.toastError('No avatar to delete!');
    }
  }

  viewCertificate(myCourse: any) {
    const modalRef = this.modalService.open(MyCertificateComponent, {
      centered: true,
      backdrop: 'static',
      size: 'xl'
    });
    modalRef.componentInstance.myCourse = myCourse;
    modalRef.componentInstance.userName = this.info.name;
    modalRef.componentInstance.appConfig = this.config;
  }

  submitChangeEmail() {
    if (
      window.confirm(
        `Are you sure to change your email to ${this.info.email}? We will send you an email to verify your new email, please verify it to continue using the site.`
      )
    )
      this.userService
        .changeEmail(this.info._id, { email: this.info.email })
        .then(() => {
          this.appService.toastSuccess(
            'An email has been sent to your new email address, please verify it.'
          );
          this.authService.removeToken();
          window.location.href = '/';
        })
        .catch((err: any) => {
          this.appService.toastError(err);
        });
  }
}
