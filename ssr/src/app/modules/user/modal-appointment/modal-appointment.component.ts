import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { IMylesson, IUser, IWebinar } from 'src/app/interface';
import { AppointmentService, AppService } from 'src/app/services';
import { environment } from 'src/environments/environment';
import { encrypt } from 'src/app/lib';
import { pick } from 'lodash';
@Component({
  selector: 'app-modal-appointment',
  templateUrl: './modal.html'
})
export class ModalAppointmentComponent implements OnInit {
  @Input() appointments: IMylesson[] = [];
  @Input() currentUser: IUser;
  @Input() webinar: IWebinar;
  @Input() type: string;
  @Input() transactionId: string;
  public currentPage = 1;
  public pageSize = 5;
  public total: number;
  public searchFields: any = {};
  public sortOption = {
    sortBy: 'startTime',
    sortType: 'asc'
  };
  public loading = false;
  public joining = false;
  public starting = false;
  public studentId: string;

  constructor(
    public activeModal: NgbActiveModal,
    private appointmentService: AppointmentService,
    private appService: AppService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.webinar) {
      if (this.type === 'student') {
        this.queryAppointmentStudent();
      } else {
        this.queryAppointmentTutor();
      }
    }
  }

  async queryAppointmentStudent() {
    this.loading = true;
    await this.appointmentService
      .search({
        page: this.currentPage,
        take: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
        userId: this.currentUser._id,
        targetType: 'webinar',
        webinarId: this.webinar._id,
        ...this.searchFields
      })
      .then((resp) => {
        this.appointments = resp.data.items;
        this.total = resp.data.count;
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
        this.appService.toastError();
      });
  }

  async queryAppointmentTutor() {
    this.loading = true;
    await this.appointmentService
      .search({
        page: this.currentPage,
        take: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
        tutorId: this.currentUser._id,
        targetType: 'webinar',
        webinarId: this.webinar._id,
        userId: this.studentId || '',
        ...this.searchFields
      })
      .then((resp) => {
        this.appointments = resp.data.items;
        this.total = resp.data.count;
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
        this.appService.toastError();
      });
  }

  pageChange() {
    if (this.type === 'student') {
      this.queryAppointmentStudent();
    } else {
      this.queryAppointmentTutor();
    }
  }

  joinMeeting(appointmentId: string) {
    if (!this.joining) {
      this.joining = true;
      this.appointmentService
        .joinMeeting(appointmentId)
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
                appointmentId: appointmentId,
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
                appointmentId
              }
            });
          }
          this.close();
        })
        .catch((err) => {
          this.joining = false;
          return this.appService.toastError(err);
        });
    } else {
      this.appService.toastSuccess('Connecting...');
    }
  }

  startMeeting(appointmentId: string) {
    if (!this.starting) {
      this.starting = true;
      this.appointmentService
        .startMeeting(appointmentId)
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
                appointmentId: appointmentId,
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
                appointmentId
              }
            });
          }
          this.close();
        })
        .catch((err) => {
          this.starting = false;
          return this.appService.toastError(err);
        });
    } else {
      this.appService.toastSuccess('Connecting...');
    }
  }

  close() {
    this.activeModal.close(true);
  }
}
