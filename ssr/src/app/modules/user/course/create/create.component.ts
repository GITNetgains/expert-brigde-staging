import { Component, OnInit } from '@angular/core';
import { pick } from 'lodash';
import {
  IMyCategory,
  IMySubject,
  IMyTopic,
  ISubject,
  IUser
} from 'src/app/interface';
import { ageFilter, quillConfig } from 'src/app/lib';
import {
  AppService,
  AuthService,
  CourseService,
  GradeService,
  MyCategoryService,
  MySubjectService,
  MyTopicService,
  STATE,
  StateService
} from 'src/app/services';
import { environment } from 'src/environments/environment';
declare let $: any;
@Component({
  selector: 'app-course-create',
  templateUrl: '../form.html'
})
export class CourseCreateComponent implements OnInit {
  public maxFileSize: any;
  public tab = 1;
  public course = {
    name: '',
    price: 0,
    categoryIds: [],
    description: '',
    mainImageId: '',
    introductionVideoId: '',
    alias: '',
    isFree: false,
    gradeIds: [],
    subjectIds: [],
    topicIds: []
  } as any;
  public loading = false;

  public isSubmitted: Boolean = false;
  public mainImageOptions: any;
  public videoOptions: any;
  public mainImageUrl: String = '';
  public videoUrl: String = '';
  public imageSelected: any[] = [];
  public videoSelected: any[] = [];
  public uploadingVideo = false;
  public uploadingImage = false;
  public checkMobileBrowser = false;
  public config: any;

  public grades: any[] = [];

  public quillConfig = quillConfig;

  public myCategories: IMyCategory[] = [];
  public mySubjects: IMySubject[] = [];
  public myTopics: IMyTopic[] = [];

  public currentUser: IUser;
  public ageFilter: any[] = ageFilter;
  constructor(
    private courseService: CourseService,
    private appService: AppService,
    private myCategoryService: MyCategoryService,
    private gradeService: GradeService,
    private authService: AuthService,
    private mySubjectService: MySubjectService,
    private myTopicService: MyTopicService,
    public stateService: StateService
  ) {
    this.maxFileSize = environment.maximumFileSize;
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      this.checkMobileBrowser = true;
    }
    this.config = this.stateService.getState(STATE.CONFIG);
  }

  ngOnInit() {
    if (this.authService.isLoggedin()) {
      this.authService.getCurrentUser().then((resp) => {
        this.currentUser = resp;
        if (this.currentUser._id) {
          this.course.tutorId = this.currentUser._id;
        }
      });
    }
    this.mainImageOptions = {
      url: environment.apiBaseUrl + '/media/photos',
      fileFieldName: 'file',
      onFinish: (resp: any) => {
        this.course.mainImageId = resp.data._id;
        this.mainImageUrl = resp.data.thumbUrl;
        this.uploadingImage = false;
      },
      onFileSelect: (resp: any) => (this.imageSelected = resp),
      accept: 'image/*',
      id: 'image-upload',
      onUploading: () => (this.uploadingImage = true)
    };

    this.videoOptions = {
      url: environment.apiBaseUrl + '/media/videos',
      fileFieldName: 'file',
      onFinish: (resp: any) => {
        this.course.introductionVideoId = resp.data._id;
        this.videoUrl = resp.data.fileUrl;
        this.uploadingVideo = false;
      },
      onFileSelect: (resp: any) => (this.videoSelected = resp),
      id: 'file-upload',
      accept: 'video/*',
      onUploading: () => (this.uploadingVideo = true)
    };
    this.queryMyCategories();
    this.queryGrades();
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
    this.gradeService
      .search({ take: 100, sort: 'ordering', sortType: 'asc' })
      .then(
        (resp) => {
          this.grades = resp.data.items;
        },
        (err) => this.appService.toastError(err)
      );
  }

  submit(frm: any) {
    this.isSubmitted = true;
    if (!frm.valid || (this.course.price <= 0 && !this.course.isFree)) {
      return this.appService.toastError('Invalid form, please try again.');
    }
    if (this.course.description) {
      this.course.description = this.course.description.replace(
        '<p data-f-id="pbf" style="text-align: center; font-size: 14px; margin-top: 30px; opacity: 0.65; font-family: sans-serif;">Powered by <a href="https://www.froala.com/wysiwyg-editor?pb=1" title="Froala Editor">Froala Editor</a></p>',
        ''
      );
    }

    if (this.course.isFree === true) this.course.price = 0;

    if (!this.course.mainImageId)
      return this.appService.toastError('Please upload main image for course!');
    if (!this.course.introductionVideoId)
      return this.appService.toastError(
        'Please upload introduction video for course!'
      );

    if (
      !this.course._id &&
      this.course.mainImageId &&
      this.course.introductionVideoId
    ) {
      this.courseService.create(this.course).then(
        (resp) => {
          this.appService.toastSuccess('Course has been created');
          this.course = resp.data;
          this.tab = 2;
          $('html, body').animate({ scrollTop: 100 });
          //this.router.navigate(['/users/courses/' + resp.data._id]);
        },
        (err) => this.appService.toastError(err)
      );
    } else if (this.course._id) {
      if (this.course.isFree === true) this.course.price = 0;
      this.courseService
        .update(
          this.course._id,
          pick(this.course, [
            'name',
            'price',
            'description',
            'alias',
            'categoryIds',
            'introductionVideoId',
            'mainImageId',
            'isFree',
            'gradeIds',
            'subjectIds',
            'topicIds',
            'age'
          ])
        )
        .then(() => {
          this.appService.toastSuccess('Updated successsfully!');
          this.tab = 2;
          this.loading = false;
        })
        .catch((err) => {
          this.loading = false;
          this.appService.toastError(err);
        });
    }
  }

  doTabSelect(tab: number) {
    this.tab = tab;
    $('html, body').animate({ scrollTop: 100 });
  }

  onSelectMyCategories(items: IMyCategory[]) {
    if (items?.length) {
      this.queryMySubjects(items.map((item) => item._id).join(','));
    } else {
      this.mySubjects = [];
      this.myTopics = [];
      this.course.subjectIds = [];
      this.course.topicIds = [];
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
            this.course.subjectIds.includes(item.originalSubjectId)
          );

          this.course.subjectIds = mySubjectSelected.map(
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
      this.course.topicIds = [];
    }
  }

  queryMyTopics(mySubjectIds: string) {
    if (!mySubjectIds) {
      this.myTopics = [];
      this.course.topicIds = [];
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
            const myTopicSelected = this.myTopics.filter(
              (item) => this.course.topicIds.indexOf(item.originalTopicId) > -1
            );
            this.course.topicIds = myTopicSelected.map(
              (item) => item.originalTopicId
            );
          }
        })
        .catch((err) => {
          return this.appService.toastError(err);
        });
  }

  saveAsDraff() {
    if (!this.course.name) {
      return this.appService.toastError(
        'Please enter course name to save as draft!'
      );
    }
    this.courseService.saveAsDraff(this.course).then(
      (resp) => {
        this.appService.toastSuccess('Course has been saved as draft');
        this.course = resp.data;
        $('html, body').animate({ scrollTop: 100 });
      },
      (err) => this.appService.toastError(err)
    );
  }
}
