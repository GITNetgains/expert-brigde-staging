import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { pick } from 'lodash-es';
import { Observable, of, Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
  map,
  catchError,
} from 'rxjs/operators';
import {
  CourseService,
  GradeService,
  UtilService,
  MyCategoryService,
  MySubjectService,
  MyTopicService,
  TutorService,
} from 'src/services';
import { environment } from 'src/environments/environment';
import { ageFilter } from 'src/constants/age';
import { imageMimeTypes, videoMimeTypes } from 'src/constants';
import { ICourse } from 'src/interfaces';
import {
  ButtonDirective,
  CardComponent,
  CardBodyComponent,
  ColComponent,
  ContainerComponent,
  FormModule,
  NavModule,
  GridModule,
  TabsModule,
  FormDirective,
  InputGroupComponent,
  FormFeedbackComponent,
  FormLabelDirective,
  FormControlDirective,
  RowComponent,
} from '@coreui/angular';

import { NgSelectModule } from '@ng-select/ng-select';
import { FileUploadComponent } from 'src/components/common/uploader/uploader.component';
import { CourseGoalComponent } from '../course-goal/course-goal.component';
import { CourseCouponComponent } from '../course-coupon/course-coupon.component';
import { CourseLectureComponent } from '../course-lecture/course-lecture.component';
import { EditorComponent } from 'src/components/common/editor/editor.component';
@Component({
  selector: 'app-course-create',
  templateUrl: '../form.html',
  styleUrls: ['../course.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    ContainerComponent,
    ColComponent,
    RowComponent,
    NgSelectModule,
    FileUploadComponent,
    NavModule,
    GridModule,
    FormModule,
    TabsModule,
    CourseGoalComponent,
    CourseCouponComponent,
    CourseLectureComponent,
    FormDirective,
    InputGroupComponent,
    FormFeedbackComponent,
    FormLabelDirective,
    FormControlDirective,
    EditorComponent,
  ],
})
export class CourseCreateComponent implements OnInit {
  private courseService = inject(CourseService);
  private utilService = inject(UtilService);
  private gradeService = inject(GradeService);
  private tutorService = inject(TutorService);
  private myCategoryService = inject(MyCategoryService);
  private route = inject(ActivatedRoute);
  private mySubjectService = inject(MySubjectService);
  private myTopicService = inject(MyTopicService);

  public course: Partial<ICourse> = {
    tutorId: '',
    name: '',
    price: 0,
    categoryIds: [],
    description: '',
    mainImageId: '',
    introductionVideoId: '',
    alias: '',
    isFree: false,
    subjectIds: [],
    topicIds: [],
    gradeIds: [],
    age: {
      from: 0,
      to: 0,
    },
  };

  public maxFileSize: number = 1024;
  public tab: number = 1;
  public tutorId: string = '';
  public loading: boolean = false;
  public isFree: boolean = false;
  public grades: any[] = [];
  public categories: any[] = [];
  public isSubmitted: boolean = false;
  public customStylesValidated: boolean = false;
  public mainImageOptions: any;
  public videoOptions: any;
  public mainImageUrl: string = '';
  public videoUrl: string = '';
  public imageSelected: any[] = [];
  public videoSelected: any[] = [];
  public uploadingVideo: boolean = false;
  public uploadingImage: boolean = false;
  public checkMobileBrowser: boolean = false;
  public searching: boolean = false;
  public searchFailed: boolean = false;

  public config: any;

  public myCategories: any[] = [];
  public mySubjects: any[] = [];
  public myTopics: any[] = [];

  public ageFilter = ageFilter;

  public tutorItems: any[] = [];
  public tutorInput$ = new Subject<string>();

  // Tutor search function
  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => (this.searching = true)),
      switchMap((term) => {
        if (term.length < 2) {
          return of([]);
        }
        return this.tutorService.search({ name: term }).pipe(
          tap(() => {
            this.searchFailed = false;
          }),
          map((resp: any) => resp.data.items),
          catchError(() => {
            this.searchFailed = true;
            return of([]);
          })
        );
      }),
      tap(() => (this.searching = false))
    );

  formatter = (x: { name: string }) => x.name;

  ngOnInit() {
    this.checkMobileBrowser =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    this.config = this.route.snapshot.data['appConfig'];
    this.queryGrades();
    this.setupFileUploadOptions();
    this.setupTutorSearch();
  }

  setupFileUploadOptions() {
    this.mainImageOptions = {
      url: `${environment.apiUrl}/media/photos`,
      fileFieldName: 'file',
      id: 'main-image-upload',
      autoUpload: false,
      multiple: false,
      maxFileSize: this.maxFileSize * 15 * 1024 * 1024,
      allowedMimeType: imageMimeTypes,
      uploadZone: true,
      onProgressItem: (fileItem: any, progress: number) => {
        console.log(`Image progress: ${progress}%`);
        this.uploadingImage = true;
      },
      onCompleteItem: (item: any, response: any) => {
        try {
          const parsedResponse =
            typeof response === 'string' ? JSON.parse(response) : response;
          if (parsedResponse && parsedResponse.data) {
            this.course.mainImageId = parsedResponse.data._id;
            this.mainImageUrl = parsedResponse.data.thumbUrl;
            this.uploadingImage = false;
            console.log('Image uploaded successfully', parsedResponse.data);
          }
        } catch (e) {
          console.error('Error parsing response:', e);
          this.utilService.toastError({
            title: 'Error',
            message: 'Failed to process server response',
          });
        }
      },
    };

    this.videoOptions = {
      url: `${environment.apiUrl}/media/videos`,
      fileFieldName: 'file',
      id: 'intro-video-upload',
      autoUpload: false,
      multiple: false,
      maxFileSize: this.maxFileSize * 15 * 1024 * 1024,
      allowedMimeType: videoMimeTypes,
      uploadZone: true,
      onProgressItem: (fileItem: any, progress: number) => {
        console.log(`Video progress: ${progress}%`);
        this.uploadingVideo = true;
      },
      onCompleteItem: (item: any, response: any) => {
        try {
          const parsedResponse =
            typeof response === 'string' ? JSON.parse(response) : response;
          if (parsedResponse && parsedResponse.data) {
            this.course.introductionVideoId = parsedResponse.data._id;
            this.videoUrl = parsedResponse.data.fileUrl;
            this.uploadingVideo = false;
            console.log('Video uploaded successfully', parsedResponse.data);
          }
        } catch (e) {
          console.error('Error parsing response:', e);
          this.utilService.toastError({
            title: 'Error',
            message: 'Failed to process server response',
          });
        }
      },
    };
  }

  setupTutorSearch() {
    this.tutorInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.searching = true)),
        switchMap((term) => {
          if (term.length < 2) {
            return of([]);
          }
          return this.tutorService.search({ name: term }).pipe(
            tap(() => {
              this.searchFailed = false;
            }),
            map((resp: any) => resp.data.items),
            catchError(() => {
              this.searchFailed = true;
              return of([]);
            })
          );
        }),
        tap(() => (this.searching = false))
      )
      .subscribe((items) => {
        this.tutorItems = items;
      });
  }

  queryGrades() {
    this.gradeService.search({ take: 100 }).subscribe({
      next: (resp: any) => {
        this.grades = resp.data.items;
      },
      error: () => {
        this.utilService.toastError({
          title: 'Error',
          message: 'Something went wrong, please try again!',
        });
      },
    });
  }

  submit(frm: NgForm) {
    this.isSubmitted = true;
    this.customStylesValidated = true;

    let hasError = false;
    let errorMessage = '';

    if (!this.course.tutorId) {
      hasError = true;
      errorMessage = 'Please select expert!';
    } else if (!this.course.name) {
      hasError = true;
      errorMessage = 'Please enter course title!';
    } else if (!this.course.categoryIds || this.course.categoryIds.length === 0) {
      hasError = true;
      errorMessage = 'Please choose category!';
    } else if (!this.course.age) {
      hasError = true;
      errorMessage = 'Please choose age!';
    } else if (!this.course.gradeIds || this.course.gradeIds.length === 0) {
      hasError = true;
      errorMessage = 'Please choose grades!';
    } else if (!this.course.isFree && (!this.course.price || this.course.price <= 0)) {
      hasError = true;
      errorMessage = 'Price must be greater than 0!';
    }

    if (hasError || !frm.valid) {
      return this.utilService.toastError({
        title: 'Error',
        message: errorMessage || 'Invalid form, please try again.',
      });
    }

    if (this.course.isFree === true) this.course.price = 0;

    if (!this.course.mainImageId) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Please upload main image for course!',
      });
      return;
    }

    if (!this.course.introductionVideoId) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Please upload introduction video for course!',
      });
      return;
    }

    if (
      !this.course._id &&
      this.course.mainImageId &&
      this.course.introductionVideoId
    ) {
      this.courseService.create(this.course).subscribe({
        next: (resp: any) => {
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'Course has been created',
          });
          this.course = resp.data;
          this.tab = 2;
          this.scrollToTop();
        },
        error: (err: any) => {
          this.utilService.toastError({
            title: 'Error',
            message: err.data?.message || 'Something went wrong!',
          });
        },
      });
    } else if (this.course._id) {
      if (this.course.isFree === true) this.course.price = 0;

      this.courseService
        .update(
          this.course._id!,
          pick(this.course, [
            'tutorId',
            'name',
            'price',
            'description',
            'alias',
            'categoryIds',
            'gradeIds',
            'introductionVideoId',
            'mainImageId',
            'isFree',
            'subjectIds',
            'topicIds',
          ])
        )
        .subscribe({
          next: () => {
            this.utilService.toastSuccess({
              title: 'Success',
              message: 'Updated successfully!',
            });
            this.tab = 2;
            this.scrollToTop();
            this.loading = false;
          },
          error: (err: any) => {
            this.loading = false;
            this.utilService.toastError({
              title: 'Error',
              message:
                err.data?.data?.message ||
                err.data?.message ||
                'Something went wrong!',
            });
          },
        });
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 100, behavior: 'smooth' });
  }

  onTabSelect(tab: number) {
    this.tab = tab;
    this.scrollToTop();
  }

  selectTutor(event: any) {
    if (event) {
      this.course.tutorId = event._id;
      this.myCategories = [];
      this.mySubjects = [];
      this.myTopics = [];
      this.course.categoryIds = [];
      this.course.subjectIds = [];
      this.course.topicIds = [];
      this.queryMyCategories();
    }
  }

  queryMyCategories() {
    this.myCategoryService
      .search({
        take: 100,
        sort: 'ordering',
        sortType: 'asc',
        isActive: true,
        tutorId: this.course.tutorId!,
      })
      .subscribe({
        next: (resp: any) => {
          if (resp.data && resp.data.items) {
            this.myCategories = resp.data.items;
          }
        },
        error: (err: any) => {
          this.utilService.toastError({
            title: 'Error',
            message:
              err.data?.data?.message ||
              'Something went wrong, please try again!',
          });
        },
      });
  }

  onSelectMyCategories(items: any[]) {
    if (items && items.length) {
      const ids = items.map((item) => item._id);
      this.queryMySubjects(ids.join(','));
    } else {
      this.mySubjects = [];
      this.myTopics = [];
      this.course.subjectIds = [];
      this.course.topicIds = [];
    }
  }

  queryMySubjects(myCategoryIds: string) {
    this.mySubjectService
      .search({
        sort: 'ordering',
        sortType: 'asc',
        isActive: true,
        tutorId: this.course.tutorId!,
        myCategoryIds,
      })
      .subscribe({
        next: (resp: any) => {
          if (resp.data && resp.data.items) {
            this.mySubjects = resp.data.items;
            const mySubjectSelected = this.mySubjects.filter((item) =>
              this.course.subjectIds?.includes(item.originalSubjectId)
            );
            this.course.subjectIds = mySubjectSelected.map(
              (item) => item.originalSubjectId
            );
            this.queryMyTopics(
              mySubjectSelected.map((item) => item._id).join(',')
            );
          }
        },
        error: (err: any) => {
          this.utilService.toastError({
            title: 'Error',
            message:
              err.data?.data?.message ||
              'Something went wrong, please try again!',
          });
        },
      });
  }

  onSelectMySubjects(items: any[]) {
    if (items && items.length) {
      const ids = items.map((item) => item._id);
      this.queryMyTopics(ids.join(','));
    } else {
      this.myTopics = [];
      this.course.topicIds = [];
    }
  }

  queryMyTopics(mySubjectIds: string) {
    if (!mySubjectIds) {
      this.myTopics = [];
      this.course.topicIds = [];
      return;
    }

    this.myTopicService
      .search({
        sort: 'ordering',
        sortType: 'asc',
        isActive: true,
        tutorId: this.course.tutorId!,
        mySubjectIds,
      })
      .subscribe({
        next: (resp: any) => {
          if (resp.data && resp.data.items) {
            this.myTopics = resp.data.items;
            const myTopicSelected = this.myTopics.filter((item) =>
              this.course.topicIds?.includes(item.originalTopicId)
            );
            this.course.topicIds = myTopicSelected.map(
              (item) => item.originalTopicId
            );
          }
        },
        error: (err: any) => {
          this.utilService.toastError({
            title: 'Error',
            message:
              err.data?.data?.message ||
              'Something went wrong, please try again!',
          });
        },
      });
  }

  saveAsDraff() {
    if (!this.course.name) {
      return this.utilService.toastError({
        title: 'Error',
        message: 'Please enter course name to save as draft!',
      });
    }

    this.courseService.saveAsDraff(this.course).subscribe({
      next: (resp: any) => {
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'Course has been saved as draft',
        });
        this.course = resp.data;
        this.scrollToTop();
      },
      error: () => {
        this.utilService.toastError({
          title: 'Error',
          message: 'Something went wrong!',
        });
      },
    });
  }

  loadTutors() {
    this.tutorService.search({ take: 10 }).subscribe({
      next: (resp: any) => {
        if (resp.data && resp.data.items) {
          this.tutorItems = resp.data.items;
        }
      },
      error: (err: any) => {
        this.utilService.toastError({
          title: 'Error',
          message: err.data?.message || 'Failed to load experts',
        });
      },
    });
  }
}
