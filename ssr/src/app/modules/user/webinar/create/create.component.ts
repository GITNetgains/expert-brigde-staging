import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  ICategory,
  IMedia,
  IMyCategory,
  IMySubject,
  IMyTopic,
  ISubject,
  IUser
} from 'src/app/interface';
import { ageFilter, randomHash, quillConfig } from 'src/app/lib';
import {
  AppService,
  CalendarService,
  GradeService,
  MediaService,
  MyCategoryService,
  MySubjectService,
  MyTopicService,
  STATE,
  StateService,
  WebinarService
} from 'src/app/services';
import { environment } from 'src/environments/environment';

@Component({ selector: 'app-webinar-create', templateUrl: '../form.html' })
export class WebinarCreateComponent implements OnInit, OnDestroy {
  public maxFileSize: number;
  public webinar = {
    name: '',
    maximumStrength: 1,
    categoryIds: [],
    isOpen: false,
    price: 0,
    mediaIds: [],
    mainImageId: '',
    description: '',
    alias: '',
    isFree: false,
    gradeIds: [],
    subjectIds: [],
    topicIds: []
  } as any;

  public isSubmitted: Boolean = false;
  public mediaOptions: any;
  public mainImageOptions: any;
  public medias: any = [];
  public mainImageUrl: String = '';
  public hashWebinar: any;
  public webinarId: any;
  public imageSelected: any[] = [];
  public filesSelected: any[] = [];
  public loading = false;
  public config: any;
  public quillConfig = quillConfig;
  public grades: any[] = [];

  public myCategories: IMyCategory[] = [];
  public mySubjects: IMySubject[] = [];
  public myTopics: IMyTopic[] = [];

  public currentUser: IUser;

  public ageFilter: any[] = ageFilter;
  public tab: string = 'basicInfo';

  constructor(
    private router: Router,
    private webinarService: WebinarService,
    private appService: AppService,
    private myCategoryService: MyCategoryService,
    private calendarService: CalendarService,
    private gradeService: GradeService,
    private mySubjectService: MySubjectService,
    private myTopicService: MyTopicService,
    private readonly mediaService: MediaService,
    public stateService: StateService
  ) {
    this.maxFileSize = environment.maximumFileSize;
    this.config = this.stateService.getState(STATE.CONFIG);
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
  }

  ngOnInit() {
    this.mainImageOptions = {
      url: environment.apiBaseUrl + '/media/photos',
      fileFieldName: 'file',
      onFinish: (resp: any) => {
        this.webinar.mainImageId = resp.data._id;
        this.mainImageUrl = resp.data.thumbUrl;
      },
      onFileSelect: (resp: any) => (this.imageSelected = resp),
      accept: 'image/*',
      id: 'image-upload'
    };
    this.mediaOptions = {
      url: environment.apiBaseUrl + '/media/files',
      fileFieldName: 'file',
      onFinish: (resp: any) => {
        this.webinar.mediaIds.push(resp.data._id);
        this.medias.push(resp.data);
      },
      onFileSelect: (resp: any) => (this.filesSelected = resp),
      id: 'file-upload'
    };
    this.queryMyCategories();
    this.queryGrades();
    this.hashWebinar = localStorage.getItem('hast_webinar');
    if (!this.hashWebinar) {
      this.hashWebinar = randomHash(32, '');
      localStorage.setItem('hast_webinar', this.hashWebinar);
    }
  }

  ngOnDestroy() {
    if (this.hashWebinar) {
      this.calendarService.deleteByHash(this.hashWebinar);
      localStorage.removeItem('hast_webinar');
    }
  }
  queryMyCategories() {
    this.loading = true;
    this.myCategoryService
      .getListOfMe({
        take: 100,
        sort: 'ordering',
        sortType: 'asc',
        isActive: true
      })
      .then((resp) => {
        this.myCategories = resp.data.items;
        this.loading = false;
      })
      .catch((err) => {
        this.loading = false;
        this.appService.toastError(err);
      });
  }
  queryGrades() {
    this.loading = true;
    this.gradeService
      .search({ take: 100, sort: 'ordering', sortType: 'asc' })
      .then((resp) => {
        this.grades = resp.data.items;
        this.loading = false;
      })
      .catch((err) => {
        this.loading = false;
        this.appService.toastError(err);
      });
  }

  removeMedia(media: IMedia, i: any) {
    this.mediaService
      .remove(media._id)
      .then((resp) => {
        if (resp.data && resp.data.ok) {
          this.appService.toastSuccess('Removed media!');
          this.webinar.mediaIds.splice(i, 1);
          this.medias.splice(i, 1);
        }
      })
      .catch((err) => this.appService.toastError(err));
  }

  submit(frm: any) {
    this.isSubmitted = true;
    if (!frm.valid) {
      return this.appService.toastError('Invalid form, please try again.');
    }
    if (this.webinar.price <= 0 && !this.webinar.isFree) {
      return this.appService.toastError('Price value should be greater than 0');
    }

    if (
      this.webinar.maximumStrength > 10 &&
      this.config?.platformOnline === 'lessonspace'
    ) {
      return this.appService.toastError(
        'Lesson space allows only 10 users for group class!'
      );
    }
    if (!this.webinar.mainImageId)
      return this.appService.toastError(
        'Please upload main image for webinar!'
      );
    if (this.webinar.isFree === true) this.webinar.price = 0;
    if (this.webinar.description) {
      this.webinar.description = this.webinar.description.replace(
        '<p data-f-id="pbf" style="text-align: center; font-size: 14px; margin-top: 30px; opacity: 0.65; font-family: sans-serif;">Powered by <a href="https://www.froala.com/wysiwyg-editor?pb=1" title="Froala Editor">Froala Editor</a></p>',
        ''
      );
    }
    this.calendarService.checkByHash(this.hashWebinar).then((check) => {
      if (!check.data.success) {
        return this.appService.toastError(
          'Please create schedule for group class if you want the group class to be public'
        );
      }
      const data = this.hashWebinar
        ? Object.assign(this.webinar, { hashWebinar: this.hashWebinar })
        : this.webinar;
      this.webinarService.create(data).then(
        () => {
          localStorage.removeItem('hast_webinar');
          this.appService.toastSuccess('Group Class created successfully!');
          this.router.navigate(['/users/groupclass']);
        },
        (err) => this.appService.toastError(err)
      );
    });
  }

  onSelectMyCategories(items: ICategory[]) {
    if (items?.length) {
      this.queryMySubjects(items.map((item) => item._id).join(','));
    } else {
      this.mySubjects = [];
      this.myTopics = [];
      this.webinar.subjectIds = [];
      this.webinar.topicIds = [];
    }
  }

  queryMySubjects(myCategoryIds: string) {
    this.mySubjectService
      .getListOfMe({
        take: 100,
        sort: 'ordering',
        sortType: 'asc',
        myCategoryIds,
        isActive: true
      })
      .then((resp) => {
        if (resp.data && resp.data.items) {
          this.mySubjects = resp.data.items;
          const mySubjectSelected = this.mySubjects.filter((item) =>
            this.webinar.subjectIds.includes(item._id)
          );
          this.webinar.subjectIds = mySubjectSelected.map(
            (item) => item.originalSubjectId
          );
          this.queryMyTopics(
            mySubjectSelected.map((item) => item._id).join(',')
          );
        }
      })
      .catch((err) => {
        return this.appService.toastError(err);
      });
  }

  onSelectMySubjects(items: ISubject[]) {
    if (items?.length) {
      this.queryMyTopics(items.map((item) => item._id).join(','));
    } else {
      this.myTopics = [];
      this.webinar.topicIds = [];
    }
  }

  queryMyTopics(mySubjectIds: string) {
    if (!mySubjectIds) {
      this.myTopics = [];
      this.webinar.topicIds = [];
    } else
      this.myTopicService
        .getListOfMe({
          take: 100,
          sort: 'ordering',
          sortType: 'asc',
          mySubjectIds,
          isActive: true
        })
        .then((resp) => {
          if (resp.data && resp.data.items) {
            this.myTopics = resp.data.items;
            const myTopicSelected = this.myTopics.filter((item) =>
              this.webinar.topicIds.includes(item._id)
            );
            this.webinar.topicIds = myTopicSelected.map(
              (item) => item.originalTopicId
            );
          }
        })
        .catch((err) => {
          return this.appService.toastError(err);
        });
  }

  onTabSelect(tab = '') {
    return tab;
  }
}
