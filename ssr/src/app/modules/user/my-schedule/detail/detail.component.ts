import { Component, Inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IMylesson, IStatsReview, IUser } from 'src/app/interface';
import {
  AppointmentService,
  AppService,
  STATE,
  StateService
} from 'src/app/services';
import { environment } from 'src/environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { decrypt, encrypt } from 'src/app/lib';
import { pick } from 'lodash';
@Component({
  selector: 'app-detail-appointment',
  templateUrl: './detail.html'
})
export class ScheduleDetailComponent implements OnInit {
  public userType: string;
  public appointment: IMylesson;
  private aId: any;
  public isShowRefundButton: Boolean = false;
  public reason = '';
  public submitted: Boolean = false;
  public hovered: number;
  public hasReview: boolean;
  public reviewOptions: any = {
    appointmentId: '',
    type: 'subject',
    rateTo: '',
    rateBy: ''
  };
  public statsReview: IStatsReview = {
    ratingAvg: 0,
    ratingScore: 0,
    totalRating: 0
  };
  public newReview: any;
  public isUpdateReview = false;

  public documentOptions: any;
  public documents: any = [];
  public documentIds: string[] = [];
  public filesSelected: any = [];

  public config: any;

  public starting = false;
  public canReview = false;
  loading = false;
  public canReschedule = true;
  public showCalendar = false;
  public rescheduling = false;
  public currentUser: IUser;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private appointmentService: AppointmentService,
    private appService: AppService,
    public stateService: StateService,
    private translate: TranslateService
  ) {
    this.config = this.stateService.getState(STATE.CONFIG);
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
    this.userType = this.currentUser.type;
  }

  ngOnInit() {
    this.aId = this.route.snapshot.paramMap.get('id');
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
            ratingAvg: this.appointment.user.ratingAvg,
            totalRating: this.appointment.user.totalRating,
            ratingScore: this.appointment.user.ratingScore
          }
        };

        this.documentOptions = {
          url:
            environment.apiBaseUrl +
            `/appointments/${this.aId}/upload-document`,
          fileFieldName: 'file',
          onFinish: (res: any) => {
            this.documentIds.push(res.data._id);
            this.documents.push(res.data);
            this.appService.toastSuccess('Uploaded successfully');
          },
          onFileSelect: (res: any) => (this.filesSelected = res),
          id: 'file-upload'
        };
        if (this.appointment.paid && this.appointment.meetingEnd) {
          this.isShowRefundButton = true;
        }
        this.reviewOptions.appointmentId = this.appointment._id;
        this.reviewOptions.rateTo = this.appointment.user._id;
        this.reviewOptions.rateBy = this.appointment.tutor._id;
        this.loading = false;

        this.appointmentService.canReschedule(this.aId).then((res: any) => {
          this.canReschedule = res.data.canReschedule;
        });
      })
      .catch((e) => this.appService.toastError(e));
  }

  cancel() {
    this.submitted = true;
    if (this.reason === '') {
      return this.appService.toastError(
        'Please enter the reason for cancellation'
      );
    }
    this.appointmentService
      .tutorCancel(this.appointment._id, { reason: this.reason })
      .then(() => {
        this.appointment.status = 'canceled';
        this.appointment.cancelReason = this.reason;
        this.appService.toastSuccess('Canceled successfully!');
      })
      .catch((err) => this.appService.toastError(err));
  }

  removeMedia(i: any) {
    this.appointmentService
      .removeDocument(this.aId, this.documentIds[i])
      .then(() => {
        this.documentIds.splice(i, 1);
        this.documents.splice(i, 1);
        this.appService.toastSuccess('Removed successfully');
      })
      .catch((e) => {
        this.appService.toastError(e);
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

  startMeeting() {
    if (!this.starting) {
      this.starting = true;
      this.appointmentService
        .startMeeting(this.appointment._id)
        .then((resp) => {
          this.starting = false;
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
          this.starting = false;
          this.appService.toastError(err);
        });
    } else {
      this.appService.toastSuccess('Connecting...');
    }
  }

  onReport(event: any) {
    if (!event.success) return;
    this.appointment.report = event.data;
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
        .checkOverlap({
          startTime: time.start,
          toTime: time.end,
          userId: this.appointment.userId
        })
        .then((resp) => {
          if (resp.data.checkOverlap) {
            this.rescheduling = false;
            this.appService.toastError(
              'The student has some other class scheduled on date and time that you select!'
            );
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
}
