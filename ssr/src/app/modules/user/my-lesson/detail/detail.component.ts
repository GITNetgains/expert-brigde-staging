import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  IFilterReview,
  IMylesson,
  IStatsReview,
  IUser
} from 'src/app/interface';
import {
  StateService,
  AppointmentService,
  AuthService,
  ReviewService,
  STATE,
  AppService
} from 'src/app/services';
import { environment } from 'src/environments/environment';
import { encrypt } from 'src/app/lib';
import { pick } from 'lodash';

@Component({
  selector: 'app-detail-lesson',
  templateUrl: './detail.html'
})
export class LessonDetailComponent implements OnInit {
  public appointment: IMylesson;
  private aId: any;
  public medias: any[] = [];
  public isShowRefundButton: Boolean = false;
  public reason = '';
  public submitted: Boolean = false;
  public review: any;
  public options: IFilterReview = {
    appointmentId: '',
    webinarId: '',
    tutorId: '',
    userId: '',
    type: '',
    rateTo: '',
    rateBy: '',
    courseId: ''
  };
  public statsReview: IStatsReview = {
    ratingAvg: 0,
    ratingScore: 0,
    totalRating: 0
  };
  public type: any;
  public config: any;
  public documents: any[] = [];
  public documentOptions: Object;
  public documentIds: string[] = [];
  public filesSelected: any = [];
  public maxFileSize: number;
  public canReschedule = true;
  public showCalendar = false;
  public joining = false;
  public canReview = false;
  public currentUser: IUser;
  loading = false;
  loadingReview = false;
  rescheduling = false;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private appService: AppService,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private reviewService: ReviewService,
    public stateService: StateService,
    private translate: TranslateService
  ) {
    this.config = this.stateService.getState(STATE.CONFIG);
  }

  ngOnInit() {
    this.aId = this.route.snapshot.paramMap.get('id');
    this.maxFileSize = environment.maximumFileSize;
    this.authService.getCurrentUser().then((resp) => {
      this.currentUser = resp;
      this.type = resp.type;
    });
    this.loading = true;
    this.appointmentService
      .findOne(this.aId)
      .then((resp) => {
        this.appointment = resp.data;
        if (
          this.appointment.status === 'completed' ||
          this.appointment.status === 'progressing'
        )
          this.canReview = true;
        if (this.appointment.documents && this.appointment.documents.length) {
          this.documents = resp.data.documents;
          this.documentIds = resp.data.documents.map((d: any) => d._id);
        }
        this.statsReview = {
          ...this.statsReview,
          ...{
            ratingAvg: this.appointment.tutor.ratingAvg,
            totalRating: this.appointment.tutor.totalRating,
            ratingScore: this.appointment.tutor.ratingScore
          }
        };
        this.loadingReview = true;
        this.reviewService
          .current(this.appointment._id, { rateTo: this.appointment.tutor._id })
          .then((reviewResp) => {
            if (reviewResp.data !== null) {
              this.review = resp.data;
            }
            this.loadingReview = false;
          })
          .catch(() => (this.loadingReview = false));
        this.documentOptions = {
          url:
            environment.apiBaseUrl +
            `/appointments/${this.aId}/upload-document`,
          fileFieldName: 'file',
          onFinish: (res: any) => {
            this.documentIds.push(res.data._id);
            this.documents.push(res.data);
            this.appService.toastSuccess('Update successfully');
          },
          onFileSelect: (res: any) => (this.filesSelected = res),
          id: 'file-upload'
        };
        if (this.appointment.paid) {
          this.isShowRefundButton = true;
        }
        this.options.appointmentId = this.appointment._id;
        this.options.type = this.appointment.targetType;
        this.options.rateTo = this.appointment.tutor._id;
        this.options.rateBy = this.appointment.user._id;
        if (this.options.type === 'webinar') {
          this.options.webinarId = this.appointment.webinarId;
          this.medias = this.appointment.webinar.media;
        }
        this.loading = false;
      })
      .catch((e) => this.appService.toastError(e));

    this.appointmentService.canReschedule(this.aId).then((resp) => {
      this.canReschedule = resp.data.canReschedule;
    });
  }

  cancel() {
    this.submitted = true;
    if (this.reason === '') {
      return this.appService.toastError(
        'Please enter the reason for cancellation'
      );
    }
    this.appointmentService
      .studentCancel(this.appointment._id, { reason: this.reason })
      .then(() => {
        this.appointment.status = 'canceled';
        this.appointment.cancelReason = this.reason;
        this.appService.toastSuccess('Canceled successfully!');
      })
      .catch((err) => {
        this.appService.toastError(err);
      });
  }

  updateDocs() {
    this.appointmentService
      .updateDocument(this.aId, { documentIds: this.documentIds })
      .then(() => {
        this.appService.toastSuccess('Update successfully');
      })
      .catch((e) => {
        this.appService.toastError(e);
      });
  }

  chooseSlot(time: any) {
    if (
      window.confirm(
        this.translate.instant('Are you sure to reschedule to this slot?')
      )
    ) {
      const data = {
        startTime: time.start,
        toTime: time.end
      };
      this.rescheduling = true;
      this.appointmentService
        .checkOverlap({ startTime: time.start, toTime: time.end })
        .then((resp) => {
          if (resp.data.checkOverlap) {
            if (
              window.confirm(
                this.translate.instant(
                  'This slot is overlap with your booked slot. Still reschedule to it?'
                )
              )
            ) {
              return this.appointmentService
                .reSchedule(this.appointment._id, data)
                .then(() => {
                  this.appService.toastSuccess('Reschedule successfully');
                  this.appointment.startTime = data.startTime;
                  this.appointment.toTime = data.toTime;
                  this.showCalendar = false;
                  this.rescheduling = false;
                })
                .catch((err) => {
                  this.rescheduling = false;
                  this.appService.toastError(err);
                });
            }
            this.rescheduling = false;
          } else {
            this.appointmentService
              .reSchedule(this.appointment._id, data)
              .then(() => {
                this.appService.toastSuccess('Reschedule successfully');
                this.appointment.startTime = data.startTime;
                this.appointment.toTime = data.toTime;
                this.showCalendar = false;
                this.rescheduling = false;
              })
              .catch((err) => {
                this.rescheduling = false;
                this.appService.toastError(err);
              });
          }
        })
        .catch((e) => {
          this.rescheduling = false;
          this.appService.toastError(e);
        });
    }
  }

  joinMeeting() {
    if (!this.joining) {
      this.joining = true;
      this.appointmentService
        .joinMeeting(this.appointment._id)
        .then((resp) => {
          this.joining = false;
          if (
            resp.data &&
            resp.data.platform === 'zoomus' &&
            resp.data['zoomus'].signature
          ) {
            const token = encrypt(
              {
                meetingInfo: resp.data['zoomus'],
                appointmentId: this.appointment._id,
                currentUser: pick(this.currentUser, ['name', 'email', 'type'])
              },
              ''
            );

            window.location.href = `${
              environment.zoomSiteUrl
            }?token=${encodeURIComponent(token)}`;
          } else if (
            resp.data &&
            resp.data.platform === 'lessonspace' &&
            resp.data['lessonspace'].url
          ) {
            localStorage.setItem(
              'lessonSpaceUrl',
              resp.data['lessonspace'].url
            );
            this.router.navigate(['/users/lesson-space'], {
              queryParams: {
                appointmentId: this.appointment._id
              }
            });
          }
        })
        .catch((err) => {
          this.joining = false;
          return this.appService.toastError(err);
        });
    } else {
      this.appService.toastSuccess('Connecting...');
    }
  }

  onReport(event: any) {
    if (!event.success) return;
    this.appointment.report = event.data;
  }
}
