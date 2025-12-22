import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FilterByDate } from '../../my-schedule/list/list.component';
import * as moment from 'moment';
import { IMylesson, ITransaction, IUser } from 'src/app/interface';
import {
  AppService,
  AppointmentService,
  AuthService,
  STATE,
  SeoService,
  StateService,
  TransactionService
} from 'src/app/services';
import { environment } from 'src/environments/environment';

import { ModalAppointmentComponent } from '../../modal-appointment/modal-appointment.component';
import { Router } from '@angular/router';
import { encrypt } from 'src/app/lib';
import { pick } from 'lodash';
declare let $: any;
@Component({
  selector: 'app-list-lesson',
  templateUrl: './list.html'
})
export class ListLessonComponent implements OnInit {
  public currentUser: IUser;
  public currentPage = 1;
  public pageSize = 10;
  public total = 2;
  public searchFields: any = {};
  public sortOption = {
    sortBy: 'createdAt',
    sortType: 'desc'
  };
  public appointments: IMylesson[] = [];
  public count = 0;
  public loading = false;
  public config: any;
  public timeout: any;
  public joining = false;
  public tab = 'subject';
  public filterTransactionOptions: any = {
    currentPage: 1,
    pageSize: 10,
    sortOption: {
      sortBy: 'createdAt',
      sortType: 'desc'
    },
    total: 0,
    loading: false,
    searchFields: {}
  };
  public transactions: ITransaction[] = [];
  filterBy: FilterByDate = FilterByDate.all_day;
  constructor(
    private auth: AuthService,
    private appointmentService: AppointmentService,
    private seoService: SeoService,
    private appService: AppService,
    private transactionService: TransactionService,
    private modalService: NgbModal,
    private router: Router,
    public stateService: StateService
  ) {
    this.seoService.setMetaTitle('My Lessons');
    this.config = this.stateService.getState(STATE.CONFIG);
  }

  ngOnInit() {
    if (this.auth.isLoggedin()) {
      this.auth.getCurrentUser().then((resp) => {
        this.currentUser = resp;
        this.query();
      });
    }
  }

  async query() {
    this.loading = true;
    await this.appointmentService
      .search({
        page: this.currentPage,
        take: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
        userId: this.currentUser._id,
        targetType: this.tab,
        paid: true,
        ...this.searchFields
      })
      .then((resp) => {
        this.count = resp.data.count;
        this.appointments = resp.data.items;
        this.total = resp.data.count;
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
        this.appService.toastError();
      });
  }

  sortBy(field: string, type: string) {
    this.sortOption.sortBy = field;
    this.sortOption.sortType = type;
    this.query();
  }

  onSort(evt: any) {
    this.sortOption = evt;
    this.query();
  }

  pageChange() {
    $('html, body').animate({ scrollTop: 0 });
    if (this.tab === 'subject') {
      this.query();
    } else {
      this.queryAppointmentWebinar();
    }
  }

  doSearch(evt: any) {
    const searchText = evt.target.value; // this is the search text
    if (this.timeout) {
      window.clearTimeout(this.timeout);
    }
    this.timeout = window.setTimeout(() => {
      this.searchFields.description = searchText;
      if (this.tab === 'subject') {
        this.query();
      } else {
        this.queryTransactionWebinar();
      }
    }, 400);
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
                appointmentId,
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
        })
        .catch((err) => {
          this.joining = false;
          return this.appService.toastError(err);
        });
    } else {
      this.appService.toastSuccess('Connecting...');
    }
  }

  onTabSelect(tab: string) {
    this.tab = tab;
    if (this.tab === 'subject') {
      this.query();
    } else this.queryAppointmentWebinar();
  }

  queryTransactionWebinar() {
    if (this.auth.isLoggedin()) {
      this.auth.getCurrentUser().then((resp) => {
        this.currentUser = resp;

        this.loading = true;
        this.transactionService
          .search({
            page: this.filterTransactionOptions.currentPage,
            take: this.filterTransactionOptions.pageSize,
            sort: `${this.filterTransactionOptions.sortOption.sortBy}`,
            sortType: `${this.filterTransactionOptions.sortOption.sortType}`,
            userId: this.currentUser._id,
            targetType: 'webinar',
            // status: 'completed'
            ...this.searchFields
          })
          .then((res) => {
            this.transactions = res.data.items;
            this.filterTransactionOptions.total = res.data.count;
            this.loading = false;
          })
          .catch((err) => {
            this.loading = false;
            return this.appService.toastError(err);
          });
      });
    }
  }

  queryAppointmentWebinar() {
    if (this.auth.isLoggedin()) {
      this.auth.getCurrentUser().then((resp) => {
        this.currentUser = resp;
        this.loading = true;
        this.appointmentService
          .searchAppointmentWebinar({
            page: this.filterTransactionOptions.currentPage,
            take: this.filterTransactionOptions.pageSize,
            sort: `${this.filterTransactionOptions.sortOption.sortBy}`,
            sortType: `${this.filterTransactionOptions.sortOption.sortType}`,
            tutorId: this.currentUser._id,
            targetType: this.tab,
            ...this.searchFields
          })
          .then((res) => {
            this.transactions = res.data.items;
            this.filterTransactionOptions.total = res.data.count;
            this.loading = false;
          })
          .catch(() => {
            this.loading = false;
            this.appService.toastError();
          });
      });
    }
  }

  openModalAppointment(transaction: any) {
    if (transaction.webinar) {
      const modalRef = this.modalService.open(ModalAppointmentComponent, {
        centered: true,
        backdrop: 'static',
        size: 'lg'
      });
      modalRef.componentInstance.currentUser = this.currentUser;
      modalRef.componentInstance.webinar = transaction.webinar;
      modalRef.componentInstance.type = 'student';
      // modalRef.componentInstance.transactionId = transaction._id;
      modalRef.result.then(
        () => {
          return;
        },
        () => {
          return;
        }
      );
    }
  }

  filterByDate() {
    switch (this.filterBy) {
      case FilterByDate.all_day:
        delete this.searchFields.startTime;
        delete this.searchFields.toTime;
        this.tab === 'subject' ? this.query() : this.queryAppointmentWebinar();
        break;
      case FilterByDate.today:
        this.searchFields.startTime = moment().startOf('day').toISOString();
        this.searchFields.toTime = moment().endOf('day').toISOString();
        this.tab === 'subject' ? this.query() : this.queryAppointmentWebinar();
        break;
      case FilterByDate.this_week:
        this.searchFields.startTime = moment().startOf('week').toISOString();
        this.searchFields.toTime = moment().endOf('week').toISOString();
        this.tab === 'subject' ? this.query() : this.queryAppointmentWebinar();
        break;
      default:
        break;
    }
  }
}
