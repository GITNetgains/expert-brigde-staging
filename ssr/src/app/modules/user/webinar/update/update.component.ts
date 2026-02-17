import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IMedia,
  IMyCategory,
  IMySubject,
  ISubject,
  IUser
} from 'src/app/interface';
import { quillConfig } from 'src/app/lib';
import {
  AppService,
  CalendarService,
  MyCategoryService,
  MySubjectService,
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

  public myCategories: IMyCategory[] = [];
  public mySubjects: IMySubject[] = [];

  public currentUser: IUser;

  constructor(
    private router: Router,
    private webinarService: WebinarService,
    private appService: AppService,
    private route: ActivatedRoute,
    private myCategoryService: MyCategoryService,
    private calendarService: CalendarService,
    private mySubjectService: MySubjectService,
    public stateService: StateService
  ) {
    this.maxFileSize = environment.maximumFileSize;
    this.config = this.stateService.getState(STATE.CONFIG);
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
  }

  ngOnInit() {
    this.loading = true;
    this.webinarId = this.route.snapshot.paramMap.get('id') as string;

    this.webinarService
      .findOne(this.webinarId)
      .then((resp) => {
        if (resp.data.media && resp.data.media.length) {
          this.medias = resp.data.media;
        }
        this.mainImageUrl = resp.data?.mainImage?.thumbUrl || resp.data?.mainImage?.fileUrl || '';
        this.webinar = resp.data;
        this.webinar.isFree = false;
        this.loading = false;
        this.queryMyCategories(true);
        this.mediaOptions = {
          url:
            environment.apiBaseUrl +
            `/webinar/${this.webinarId}/upload-document`,
          fileFieldName: 'file',
          onFinish: (res: any) => {
            const data = res?.data ?? res;
            if (data) {
              this.medias.push(data);
              this.appService.toastSuccess('Updated successfuly!');
            }
            this.filesSelected = [];
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
      uploadOnSelect: true,
      onFinish: (resp: any) => {
        const data = resp?.data ?? resp;
        if (data && !resp?.error) {
          this.webinar.mainImageId = data._id || data.id;
          this.mainImageUrl = data.thumbUrl || data.fileUrl || data.mediumUrl || data.url || '';
          this.imageSelected = [];
        }
      },
      onError: (err: any) => {
        const msg = err?.error?.message || err?.message || err?.data?.message || 'Main image upload failed';
        this.appService.toastError(msg);
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
  submit(frm: any) {
    this.isSubmitted = true;
    if (!frm.valid) {
      return this.appService.toastError('Invalid form, please try again.');
    }
    if (this.webinar.price <= 0) {
      return this.appService.toastError('Price value should be greater than 0');
    }
    this.webinar.isFree = false;

    if (!this.webinar.mainImageId)
      return this.appService.toastError(
        'Please upload main image for webinar!'
      );

    if (
      this.webinar.maximumStrength > 10 &&
      this.config?.platformOnline === 'lessonspace'
    ) {
      return this.appService.toastError(
        'Lesson space allows only 10 users for group session!'
      );
    }
    this.loading = true;
    this.calendarService.checkByWebinar(this.webinarId).then((check) => {
      if (!check.data.success) {
        this.loading = false;
        return this.appService.toastError(
          'Please create schedule for group session if you want the group session to be public'
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
            'subjectIds'
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
      this.webinar.subjectIds = [];
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
        }
      })
      .catch((err) => {
        return this.appService.toastError(err);
      });
  }

  onSelectMySubjects(_items: ISubject[]) {
    // Topics removed from group class form
  }
}
