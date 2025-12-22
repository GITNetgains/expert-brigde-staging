import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import pick from 'lodash/pick';
import { IMyCategory, IMySubject, IMyTopic, ISubject } from 'src/app/interface';
import { ageFilter, quillConfig } from 'src/app/lib';
import {
  AppService,
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
  selector: 'app-course-update',
  templateUrl: '../form.html'
})
export class CourseUpdateComponent implements OnInit {
  public maxFileSize: any;
  public tab = 1;
  public courseId: any;
  public course = {} as any;
  public isSubmitted = false;
  public loading = false;

  public mainImageOptions: any;
  public videoOptions: any;
  public mainImageUrl = '';
  public videoUrl = '';
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

  public ageFilter: any[] = ageFilter;

  constructor(
    private courseService: CourseService,
    private appService: AppService,
    private myCategoryService: MyCategoryService,
    private route: ActivatedRoute,
    private gradeService: GradeService,
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
    this.loading = true;
    this.courseId = this.route.snapshot.paramMap.get('id');

    this.queryGrades();
    this.courseService
      .findOne(this.courseId)
      .then((resp) => {
        this.mainImageUrl = resp.data.mainImage
          ? resp.data.mainImage.thumbUrl
          : null;
        this.videoUrl = resp.data.videoIntroduction
          ? resp.data.videoIntroduction.fileUrl
          : null;
        this.course = resp.data;
        this.loading = false;
        this.queryMyCategories(true);
      })
      .catch((err) => {
        this.loading = false;
        this.appService.toastError(err);
      });
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
            this.course.categoryIds.includes(item.originalCategoryId)
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
    this.loading = true;
    if (this.course.isFree === true) this.course.price = 0;
    this.courseService
      .update(
        this.courseId,
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
        this.appService.toastSuccess('Updated successfully!');
        this.tab = 2;
        $('html, body').animate({ scrollTop: 100 });
        //this.router.navigate(['/users/courses']);
        this.loading = false;
      })
      .catch((err) => {
        this.loading = false;
        this.appService.toastError(err);
      });
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

  async onSelectMySubjects(items: ISubject[]) {
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
            const myTopicSelected = this.myTopics.filter((item) =>
              this.course.topicIds.includes(item.originalTopicId)
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
    return;
  }
}
