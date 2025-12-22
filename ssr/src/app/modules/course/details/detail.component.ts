import {
  AfterViewInit,
  Component,
  Inject,
  OnInit,
  PLATFORM_ID
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  ICoupon,
  ICourse,
  ILecture,
  ILectureMeida,
  IMyCourse,
  ISection,
  IStatsReview,
  IUser
} from 'src/app/interface';
import {
  AppService,
  AuthService,
  CourseService,
  FavoriteService,
  LanguageService,
  MyCourseService,
  STATE,
  SectionService,
  SeoService,
  StateService
} from 'src/app/services';
import { environment } from 'src/environments/environment';
import { MediaModalComponent } from 'src/app/components/media/media-modal/media-modal.component';
import { LectureModalComponent } from 'src/app/components/course/lecture-modal/lecture-modal.component';
import * as jQuery from 'jquery';
@Component({
  selector: 'app-course-detail',
  templateUrl: './detail.html'
})
export class CourseDetailComponent implements OnInit, AfterViewInit {
  public course: ICourse;
  public myCourse: IMyCourse;
  public myCourseId: string;
  public targetType = 'course';
  public sections: ISection[] = [];
  public courseParam: string;
  public courseId: string;
  public tutorId: string;
  public enrolledList: any[] = [];
  public isLoggedin = false;
  public currentUser: IUser;
  public salePrice: any;
  public coupon: ICoupon;
  public saleValue: any;
  public usedCoupon: Boolean = false;
  public appliedCoupon: Boolean = false;
  public couponCode: any = '';
  public videoUrl = '';
  public showChar = 1000;
  public showMore = false;
  public indexSection: number;
  public indexLecture: number;
  public indexMedia: number;
  public canView = false;
  public completedPercent = 0;
  public emailRecipient: string;
  public config: any;
  public openLectureId: string;
  public totalMedias: number;
  public optionsReview: any = {
    courseId: ''
  };
  public optionsCoupon: any = {
    targetType: 'course'
  };
  public shownItem: any = {
    title: '',
    type: '',
    url: ''
  };
  public type: any;
  public statsReview: IStatsReview = {
    ratingAvg: 0,
    ratingScore: 0,
    totalRating: 0
  };
  showBooking = false;
  appliedCouponCode = '';
  constructor(
    private courseService: CourseService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router,
    private sectionService: SectionService,
    public languageService: LanguageService,
    private favoriteService: FavoriteService,
    private mycourseService: MyCourseService,
    private appService: AppService,
    public stateService: StateService,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.courseParam = this.route.snapshot.params['id'];
    // this.optionsReview.courseId = this.courseId;
    this.showBooking = this.stateService.showBooking();
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
    this.config = this.stateService.getState(STATE.CONFIG);
    this.course = this.route.snapshot.data['course'];
    this.seoService.setMetaTitle(this.course.name);
    this.populateDependent();
    this.seoService.addMetaTags([
      {
        property: 'og:title',
        content: this.course.name
      },
      {
        property: 'og:image',
        content:
          this.course?.mainImage?.fileUrl ||
          (this.config?.homepagePicture &&
          this.config?.homepagePicture?.howItWork
            ? this.config?.homepagePicture?.howItWork
            : `${environment.url}/assets/images/tutors01.jpg`)
      },
      {
        property: 'og:description',
        content: 'Livelearn is online learning platform'
      }
    ]);
  }
  async ngOnInit() {
    if (!this.course && this.appService.isBrowser) {
      this.findOneCourse();
    }
  }

  findOneCourse() {
    this.courseService
      .findOne(this.courseParam)
      .then((resp) => {
        this.course = resp.data;
        this.populateDependent();
      })
      .catch((err) => {
        if (err.data.code == '404')
          this.router.navigate(['pages/404-not-found']);
        else {
          this.router.navigate(['pages/error', err.data.code]);
        }
      });
  }

  populateDependent() {
    this.courseId = this.course._id;
    this.optionsReview.courseId = this.course._id;
    this.salePrice = this.course.price;
    this.tutorId = this.course.tutorId;
    if (this.currentUser && this.currentUser._id === this.tutorId)
      this.canView = true;
    this.course.totalLecture = 0;
    this.course.totalLength = 0;
    this.course.totalMedia = 0;
    this.videoUrl = this.course.videoIntroduction.fileUrl;
    if (this.course._id) {
      this.statsReview = {
        ...this.statsReview,
        ...{
          ratingAvg: this.course.ratingAvg,
          totalRating: this.course.totalRating,
          ratingScore: this.course.ratingScore
        }
      };

      this.courseService.getEnrolledList(this.courseId).then((resp) => {
        resp.data.items.forEach((item: any) => {
          if (item.type === 'booking') this.enrolledList.push(item);
        });
        this.enrolledList = this.enrolledList.slice(0, 9);
      });

      this.optionsCoupon.targetId = this.courseId;
      this.optionsCoupon.tutorId = this.course.tutorId;
      if (this.auth.isLoggedin()) {
        if (this.course.booked) {
          this.canView = true;
          //find myCourse
          this.mycourseService
            .search({ userId: this.currentUser._id })
            .then((resp) => {
              if (resp.data.items.length) {
                resp.data.items.forEach((item: any) => {
                  if (item.courseId === this.courseId) {
                    this.myCourse = item;
                    this.myCourseId = item.id;
                    if (this.course.totalMedia > 0)
                      this.completedPercent = Math.ceil(
                        (this.myCourse.lectureMediaIdsCompleted.length /
                          this.course.totalMedia) *
                          100
                      );
                  }
                });
              }
            });
        }
      }
    }

    if (
      this.course &&
      this.course.description &&
      this.course.description.length > this.showChar
    ) {
      this.showMore = true;
    }

    this.sectionService
      .search({
        courseId: this.courseId,
        take: 100,
        sort: 'ordering',
        sortType: 'asc'
      })
      .then((resp) => {
        if (resp.data) {
          this.sections = resp.data.items;
          this.sections.map((item) => {
            this.calDuration(item);
            this.course.totalLength += item.duration;
            this.course.totalLecture += item.totalLecture;
            this.course.totalMedia += item.totalMedia;
          });
        }
      })
      .catch((err) => {
        if (this.course.booked) {
          this.appService.toastError('You have purchased this course already');
        } else {
          this.appService.toastError(err);
        }
      });
  }

  enrollCourse(course: any, type: string) {
    if (!this.auth.isLoggedin()) {
      return this.appService.toastError('Please Log in to buy the course!');
    }
    const params = Object.assign({
      targetType: this.targetType,
      targetId: course._id,
      tutorId: course.tutorId,
      redirectSuccessUrl: environment.url + '/payments/success',
      cancelUrl: environment.url + '/payments/cancel',
      type: type,
      emailRecipient: this.emailRecipient
    });
    if (this.appliedCouponCode && this.appliedCoupon) {
      params.couponCode = this.appliedCouponCode;
    }
    if (this.salePrice <= 0 || course.isFree) {
      return this.courseService
        .enroll(params)
        .then((resp) => {
          if (resp.data.status === 'completed') {
            this.appService.toastSuccess(
              'Have successfully booked free courses'
            );
            return this.router.navigate(['/users/my-courses']);
          } else {
            return this.router.navigate(['/payments/cancel']);
          }
        })
        .catch((e) => {
          this.appService.toastError(e);
          this.router.navigate(['/payments/cancel']);
        });
    } else {
      localStorage.setItem('paymentParams', JSON.stringify(params));
      return this.router.navigate(['/payments/pay'], {
        queryParams: {
          type: type,
          targetType: 'course',
          targetName: this.course.name,
          tutorName: this.course.tutor.name
        },
        state: params
      });
    }
  }

  applyCoupon(event: { appliedCoupon: boolean; coupon: ICoupon }) {
    this.appliedCoupon = event.appliedCoupon;
    if (this.appliedCoupon) {
      this.appliedCouponCode = event.coupon.code;
      if (event.coupon.type === 'percent') {
        this.saleValue = event.coupon.value;
        this.salePrice =
          this.course.price - this.course.price * (this.saleValue / 100) <= 0
            ? 0
            : this.course.price - this.course.price * (this.saleValue / 100);
      } else if (event.coupon.type === 'money') {
        this.saleValue =
          event.coupon.value > this.course.price
            ? this.course.price
            : event.coupon.value;
        this.salePrice = this.course.price - this.saleValue;
      }
      this.appService.toastSuccess('Applied coupon');
    } else {
      this.salePrice = this.course.price || 0;
    }
  }

  onCancelCoupon(event: { cancelled: boolean }) {
    if (event.cancelled) {
      this.salePrice = this.course.price || 0;
      this.saleValue = 0;
      this.appliedCoupon = false;
      this.appliedCouponCode = '';
    }
  }

  returnDuration(seconds: number) {
    if (seconds == 0) return '00:00';
    else if (seconds < 10) return '00:0' + seconds;
    let duration = '';
    if (seconds < 60) return '00:' + seconds;
    else {
      let hour, second;
      hour = seconds < 3600 ? 0 : Math.floor(seconds / 3600);
      if (hour > 0) {
        if (hour < 10) hour = '0' + hour;
        duration = hour + ':';
      }
      const remainSecond = seconds - parseInt(hour as string) * 3600;
      const minute =
        Math.floor(remainSecond / 60) < 10
          ? '0' + Math.floor(remainSecond / 60)
          : Math.floor(remainSecond / 60);
      second =
        seconds - parseInt(hour as string) * 3600 - (minute as number) * 60;
      if (second < 10) second = '0' + second;
      return duration + minute + ':' + second;
    }
  }

  calDuration(section: ISection) {
    let countMedia = 0;
    const lectures = section.lectures || [];
    let duration = 0;
    lectures.forEach((item) => {
      let lectureDuration = 0;
      item.medias &&
        item.medias.forEach((media) => {
          countMedia++;
          if (media.mediaType === 'pdf') {
            duration += media.totalLength || 0;
            lectureDuration += media.totalLength || 0;
          } else {
            duration += (media.media && media.media.duration) || 0;
            lectureDuration += (media.media && media.media.duration) || 0;
          }
        });
      item.duration = lectureDuration;
    });
    section.duration = duration;
    section.totalMedia = countMedia;
  }

  returnDurationString(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds - h * 3600) / 60);
    const s = seconds - h * 3600 - m * 60;
    if (h > 0) {
      return h + 'h' + m + 'm';
    } else {
      return m + 'm' + s + 's';
    }
  }

  favorite() {
    if (!this.auth.isLoggedin())
      this.appService.toastError('Please Log in to add to your favorites');
    else {
      const params = Object.assign(
        {
          courseId: this.course._id,
          type: 'course'
        },
        {}
      );
      this.favoriteService
        .favorite(params, 'course')
        .then(() => {
          this.course.isFavorite = true;
          this.appService.toastSuccess(
            'Added to your favorite course list successfully!'
          );
        })
        .catch(() => this.appService.toastError());
    }
  }

  unFavorite() {
    if (!this.auth.isLoggedin()) this.appService.toastError('');
    else {
      this.favoriteService
        .unFavorite(this.course._id, 'course')
        .then(() => {
          this.course.isFavorite = false;
          this.appService.toastSuccess(
            'Deleted from your favorite course list successfully!'
          );
        })
        .catch(() => this.appService.toastError());
    }
  }
  viewMedia(
    media: ILectureMeida,
    iSection: number,
    iLecture: number,
    iMedia: number
  ) {
    this.indexLecture = iLecture;
    this.indexSection = iSection;
    this.indexMedia = iMedia;
    const modalRef = this.modalService.open(LectureModalComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg'
    });
    modalRef.componentInstance.lecture = media;

    if (this.myCourse) {
      if (
        media._id &&
        !this.myCourse.lectureMediaIdsCompleted.includes(media._id)
      ) {
        this.myCourse.lectureMediaIdsCompleted.push(media._id);
        this.completedPercent = Math.ceil(
          (this.myCourse.lectureMediaIdsCompleted.length /
            this.course.totalMedia) *
            100
        );

        if (this.completedPercent == 100) {
          this.mycourseService
            .complete(this.myCourseId)
            .then(() => {
              this.appService.toastSuccess(
                'You have completed this course. Check your profile to see the cerificate.'
              );
            })
            .catch((err) => {
              this.appService.toastError(err);
            });
        }

        const params = { lectureMediaId: media._id };
        this.mycourseService
          .updateProgress(this.myCourseId, params)
          .catch((err) => {
            this.appService.toastError(err);
          });
      }
    }
  }

  openLecture(lecture: ILecture, iSection: number, iLecture: number) {
    this.indexLecture = iLecture;
    this.indexSection = iSection;
    if (lecture._id && this.openLectureId !== lecture._id) {
      this.openLectureId = lecture._id;
    } else this.openLectureId = '';
  }

  videoTrialVideo(section: ISection) {
    const { trialVideo } = section;
    if (trialVideo && trialVideo.fileUrl) {
      const modalRef = this.modalService.open(MediaModalComponent, {
        centered: true,
        backdrop: 'static',
        size: 'lg'
      });
      modalRef.componentInstance.media = {
        ...trialVideo,
        name: `${section.title} trailer video`
      };
    }
  }

  ngAfterViewInit(): void {
    if (this.appService.isBrowser) {
      (function ($) {
        $(document).ready(function () {
          function toggleShow(this: any) {
            const opened = $(this).hasClass('less');
            $(this)
              .text(opened ? 'Read More...' : 'Read Less...')
              .toggleClass('less read_less', !opened);
            $(this).siblings('li.toggleable').slideToggle();
          }

          $('#accordion').on('hide.bs.collapse show.bs.collapse', (e: any) => {
            $(e.target)
              .prev()
              .find('.btn-collapse i:last-child')
              .toggleClass('fa-minus fa-plus');
          });
          $('ul.term-list').each(function (this: any) {
            if ($(this).find('li').length > 3) {
              $('li', this).eq(1).nextAll().hide().addClass('toggleable');
              $(this).append('<div class="more read_more">Read More...</div>');
            }
            $(this).on('click', '.more', toggleShow);
          });
        });
      })(jQuery);
    }
  }
}
