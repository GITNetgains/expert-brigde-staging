import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { IMylesson, ITransaction, IUser } from 'src/app/interface';
import {
  AppService,
  AppointmentService,
  STATE,
  SeoService,
  StateService,
  TransactionService
} from 'src/app/services';
import { environment } from 'src/environments/environment';
import { ModalAppointmentComponent } from '../../modal-appointment/modal-appointment.component';
import { encrypt } from 'src/app/lib';
import { pick } from 'lodash';
declare let $: any;

// eslint-disable-next-line no-shadow
export enum FilterByDate {
  all_day = 'all_day',
  today = 'today',
  this_week = 'this_week'
}
@Component({
  selector: 'app-list-schedule',
  templateUrl: './list.html'
})
export class ListScheduleComponent implements OnInit {
  public currentUser: IUser;
  public currentPage = 1;
  public pageSize = 10;
  public searchFields: any = {};
  public sortOption = {
    sortBy: 'createdAt',
    sortType: 'desc'
  };
  public appointments: IMylesson[] = [];
  public count = 0;
  public loading = false;
  public timeout: any;
  public starting = false;
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
    private appointmentService: AppointmentService,
    private seoService: SeoService,
    private appService: AppService,
    private transactionService: TransactionService,
    private modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute,
    public stateService: StateService
  ) {
    this.seoService.setMetaTitle('My Appointments');
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
  }
  ngOnInit() {
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam === 'webinar') {
      this.tab = 'webinar';
    }
    if (this.currentUser && this.currentUser._id) {
      if (this.tab === 'subject') {
        this.query();
      } else {
        this.queryAppointmentWebinar();
      }
    }
  }

  query() {
    this.loading = true;
    this.appointmentService
      .search({
        page: this.currentPage,
        take: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
        tutorId: this.currentUser._id,
        targetType: this.tab,
        paid: true,
        ...this.searchFields
      })
      .then((resp) => {
        this.count = resp.data.count;
        this.appointments = resp.data.items;
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

  onPageSizeChangeWebinar() {
    this.filterTransactionOptions.currentPage = 1;
    this.queryAppointmentWebinar();
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
            resp.data['zoomus'].url
          ) {
            window.open(resp.data['zoomus'].url, '_blank');
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
          } else {
            this.appService.toastError('Could not create meeting. Please try again.');
          }
        })
        .catch((err) => {
          this.starting = false;
          return this.appService.toastError(err);
        });
    } else {
      this.appService.toastSuccess('Connecting...');
    }
  }

  queryTransactionWebinar() {
    if (this.currentUser && this.currentUser._id) {
      this.loading = true;
      this.transactionService
        .getTransactionsOfTutor({
          page: this.filterTransactionOptions.currentPage,
          take: this.filterTransactionOptions.pageSize,
          sort: `${this.filterTransactionOptions.sortOption.sortBy}`,
          sortType: `${this.filterTransactionOptions.sortOption.sortType}`,
          tutorId: this.currentUser._id,
          targetType: 'webinar',
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
    }
  }

  queryAppointmentWebinar() {
    if (this.currentUser && this.currentUser._id) {
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
    }
  }

  onTabSelect(tab: string) {
    this.tab = tab;
    if (this.tab === 'subject') {
      this.query();
    } else this.queryAppointmentWebinar();
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
      modalRef.componentInstance.studentId = transaction.userId;
      modalRef.componentInstance.type = 'tutor';
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
