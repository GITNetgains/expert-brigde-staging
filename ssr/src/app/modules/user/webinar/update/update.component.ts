import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IGrade,
  IMedia,
  IMyCategory,
  IMySubject,
  IMyTopic,
  ISubject,
  IUser
} from 'src/app/interface';
import { ageFilter, quillConfig } from 'src/app/lib';
import {
  AppService,
  CalendarService,
  GradeService,
  MyCategoryService,
  MySubjectService,
  MyTopicService,
  STATE,
  StateService,
  WebinarService
} from 'src/app/services';
import { environment } from 'src/environments/environment';
import pick from 'lodash/pick';

@Component({
  selector: 'app-webinar-update',
  templateUrl: '../form.html'
})
export class WebinarUpdateComponent implements OnInit {
  public maxFileSize: number;
  public tab = 'basicInfo';
  public loading = false;
  public webinar: any = {};
  public isSubmitted: Boolean = false;
  public webinarId = '';
  public medias: any = [];
  public mediaOptions: any;
  public mainImageOptions: any;
  public mainImageUrl: String = '';
  public hashWebinar: any;
  public imageSelected: any[] = [];
  public filesSelected: any[] = [];
  public config: any;
  public quillConfig = quillConfig;
  public grades: IGrade[] = [];

  public myCategories: IMyCategory[] = [];
  public mySubjects: IMySubject[] = [];
  public myTopics: IMyTopic[] = [];

  public ageFilter: any[] = ageFilter;
  public currentUser: IUser;

  constructor(
    private router: Router,
    private webinarService: WebinarService,
    private appService: AppService,
    private route: ActivatedRoute,
    private myCategoryService: MyCategoryService,
    private calendarService: CalendarService,
    private gradeService: GradeService,
    private mySubjectService: MySubjectService,
    private myTopicService: MyTopicService,
    public stateService: StateService
  ) {
    this.maxFileSize = environment.maximumFileSize;
    this.config = this.stateService.getState(STATE.CONFIG);
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
  }

  ngOnInit() {
    this.loading = true;
    this.webinarId = this.route.snapshot.paramMap.get('id') as string;

    this.queryGrades();
    this.webinarService
      .findOne(this.webinarId)
      .then((resp) => {
        if (resp.data.media && resp.data.media.length) {
          this.medias = resp.data.media;
        }
        this.mainImageUrl = resp.data.mainImage.thumbUrl;
        this.webinar = resp.data;
        this.loading = false;
        this.queryMyCategories(true);
        this.mediaOptions = {
          url:
            environment.apiBaseUrl +
            `/webinar/${this.webinarId}/upload-document`,
          fileFieldName: 'file',
          onFinish: (res: any) => {
            this.medias.push(res.data);
            this.appService.toastSuccess('Updated successfuly!');
          },
          onFileSelect: (res: any) => (this.filesSelected = res),
          id: 'file-upload'
        };
      })
      .catch((err) => {
        this.loading = false;
        this.appService.toastError(err);
      });
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
  }

  removeMedia(media: IMedia, i: number) {
    this.webinarService
      .removeDocument(this.webinar._id, media._id)
      .then((resp) => {
        if (resp.data && resp.data.success) {
          this.appService.toastSuccess('Removed media!');
          this.webinar.mediaIds.splice(i, 1);
          this.medias.splice(i, 1);
        }
      })
      .catch((err) => this.appService.toastError(err));
  }

  queryMyCategories(init = false) {
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
        if (init) {
          const myCategorySelected = this.myCategories.filter((item) =>
            this.webinar.categoryIds.includes(item.originalCategoryId)
          );

          this.queryMySubjects(
            myCategorySelected.map((item) => item._id).join(','),
            true
          );
        }
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
  submit(frm: any) {
    this.isSubmitted = true;
    if (!frm.valid) {
      return this.appService.toastError('Invalid form, please try again.');
    }
    if (this.webinar.price <= 0 && !this.webinar.isFree) {
      return this.appService.toastError('Price value should be greater than 0');
    }
    if (this.webinar.isFree === true) this.webinar.price = 0;

    if (!this.webinar.mainImageId)
      return this.appService.toastError(
        'Please upload main image for webinar!'
      );

    if (
      this.webinar.maximumStrength > 10 &&
      this.config?.platformOnline === 'lessonspace'
    ) {
      return this.appService.toastError(
        'Lesson space allows only 10 users for group class!'
      );
    }
    this.loading = true;
    this.calendarService.checkByWebinar(this.webinarId).then((check) => {
      if (!check.data.success) {
        this.loading = false;
        return this.appService.toastError(
          'Please create schedule for group classif you want the group class to be public'
        );
      }
      this.webinarService
        .update(
          this.webinarId,
          pick(this.webinar, [
            'name',
            'maximumStrength',
            'categoryIds',
            'isOpen',
            'price',
            'mainImageId',
            'description',
            'alias',
            'isFree',
            'gradeIds',
            'subjectIds',
            'topicIds',
            'age'
          ])
        )
        .then(() => {
          this.appService.toastSuccess('Updated successfuly!');
          this.router.navigate(['/users/groupclass']);
          this.loading = false;
        })
        .catch((err) => {
          this.loading = false;
          this.appService.toastError(err);
        });
    });
  }
  onTabSelect(tab: string) {
    this.tab = tab;
  }

  onSelectMyCategories(items: IMyCategory[]) {
    if (items?.length) {
      this.queryMySubjects(items.map((item) => item._id).join(','));
    } else {
      this.mySubjects = [];
      this.myTopics = [];
      this.webinar.subjectIds = [];
      this.webinar.topicIds = [];
    }
  }

  queryMySubjects(myCategoryIds: string, init = false) {
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
            this.webinar.subjectIds.includes(item.originalSubjectId)
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

  async onSelectMySubjects(items: ISubject[]) {
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
              this.webinar.topicIds.includes(item.originalTopicId)
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
}
