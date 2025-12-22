import { Component, OnInit, Input, Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import pick from 'lodash/pick';
import {
  NgbDate,
  NgbDateParserFormatter,
  NgbDateStruct
} from '@ng-bootstrap/ng-bootstrap';
import { ICourse, IUser, IWebinar, ICoupon } from 'src/app/interface';
import {
  AppService,
  CouponService,
  CourseService,
  STATE,
  SeoService,
  StateService,
  WebinarService
} from 'src/app/services';

function padNumber(value: number | 0) {
  if (!isNaN(value) && value !== null) {
    return `0${value}`.slice(-2);
  }
  return '';
}

@Injectable()
export class NgbDateCustomParserFormatter extends NgbDateParserFormatter {
  parse(value: string): NgbDateStruct | null {
    if (value) {
      const dateParts = value.trim().split('/');

      const dateObj: NgbDateStruct = {
        day: <any>null,
        month: <any>null,
        year: <any>null
      };
      const dateLabels = Object.keys(dateObj);

      dateParts.forEach((datePart, idx) => {
        dateObj[dateLabels[idx] as keyof NgbDateStruct] =
          parseInt(datePart, 10) || <any>null;
      });
      return dateObj;
    }
    return null;
  }

  static formatDate(date: NgbDateStruct | NgbDate | null): string {
    return date
      ? `${padNumber(date.day)}/${padNumber(date.month)}/${date.year || ''}`
      : '';
  }

  format(date: NgbDateStruct | null): string {
    return NgbDateCustomParserFormatter.formatDate(date);
  }
}
@Component({
  selector: 'app-coupon-form',
  templateUrl: './form.html'
})
export class CouponFormComponent implements OnInit {
  @Input() tutor: IUser;
  @Input() webinar: IWebinar;
  @Input() targetType: string;
  @Input() coupon = {
    name: '',
    code: '',
    type: 'percent',
    value: 0,
    webinarId: null,
    courseId: null,
    tutorId: null,
    expiredDate: '',
    active: true,
    startTime: '',
    limitNumberOfUse: 0,
    targetType: 'all'
  } as any;
  public time = {
    startTime: {
      day: 0,
      month: 0,
      year: 0
    },
    expiredDate: {
      day: 0,
      month: 0,
      year: 0
    }
  };
  public validTime = {} as any;
  public isSubmitted: Boolean = false;
  public currentYear = new Date().getFullYear();
  webinars: IWebinar[] = [];
  courses: ICourse[] = [];
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private appService: AppService,
    private couponService: CouponService,
    private stateService: StateService,
    private webinarService: WebinarService,
    private courseService: CourseService,
    private seo: SeoService
  ) {
    this.seo.setMetaTitle('Create new coupon');
    this.route.params.subscribe((params) => {
      if (params && params.id) {
        this.couponService
          .findOne(params.id)
          .then((resp) => {
            this.coupon = resp.data;
            const startTime = new Date(this.coupon.startTime);
            const expiredDate = new Date(this.coupon.expiredDate);
            this.time.startTime = {
              year: startTime.getFullYear(),
              month: startTime.getMonth() === 0 ? 12 : startTime.getMonth() + 1,
              day: startTime.getDate()
            };
            this.time.expiredDate = {
              year: expiredDate.getFullYear(),
              month:
                expiredDate.getMonth() === 0 ? 12 : expiredDate.getMonth() + 1,
              day: expiredDate.getDate()
            };
            if (this.coupon.targetType === 'webinar') {
              this.queryWebinar();
            }

            if (this.coupon.targetType === 'course') {
              this.queryCourse();
            }
          })
          .catch((err) =>
            this.appService.toastError(
              (err.data.data && err.data.data.message) ||
                err.data.message ||
                err.data.email
            )
          );
      }
    });
  }

  ngOnInit() {
    this.tutor = this.stateService.getState(STATE.CURRENT_USER);
    if (this.tutor && this.tutor._id) {
      this.coupon.tutorId = this.tutor._id;
    }
  }
  selectDate(event: NgbDate, field = 'expiredDate' as keyof ICoupon) {
    const date = `${event.day}-${event.month}-${event.year}`;

    if (
      moment(date, 'DD/MM/YYYY')
        .add(30, 'second')
        .utc()
        .isBefore(moment().set('hour', 0).set('minute', 0).set('second', 0))
    ) {
      this.validTime[field] = true;
      return this.appService.toastError(
        'Please select date greater than or equal to the current date'
      );
    }
    this.validTime[field] = false;
    this.coupon[field] = new Date(
      event.year,
      event.month - 1,
      event.day
    ).toString();

    if (
      field === 'expiredDate' &&
      this.coupon.startTime &&
      this.coupon.expiredDate &&
      moment(this.coupon.startTime).isAfter(moment(this.coupon.expiredDate))
    ) {
      this.validTime[field] = true;
      return this.appService.toastError(
        'The expiration date must be greater than the start date'
      );
    } else {
      this.coupon.expiredDate = moment(this.coupon.expiredDate)
        .set('hour', 23)
        .set('minute', 59)
        .set('second', 59)
        .toDate();
      this.validTime[field] = false;
    }
  }

  queryWebinar() {
    this.webinarService
      .search({
        take: 100,
        tutorId: this.coupon.tutorId
      })
      .then((resp) => {
        this.webinars = resp.data.items;
        // this.coupon.webinarId = this.webinars.length > 0 ? this.webinars[0]._id : null;
        if (
          this.coupon.targetType == 'webinar' &&
          ((this.webinars && this.webinars.length === 0) || !this.webinars)
        ) {
          return this.appService.toastError("You don't have webinars");
        }
      })
      .catch((e: any) => this.appService.toastError(e));
  }

  queryCourse() {
    this.courseService
      .search({ take: 100, tutorId: this.coupon.tutorId })
      .then((resp) => {
        this.courses = resp.data.items;
        if ((this.courses && this.courses.length === 0) || !this.courses) {
          return this.appService.toastError("You don't have course");
        }
      })
      .catch((e: any) => this.appService.toastError(e));
  }

  onTargetTypeChange() {
    if (this.coupon.targetType === 'webinar') {
      this.coupon.courseId = null;
      this.queryWebinar();
    } else if (this.coupon.targetType === 'course') {
      this.coupon.webinarId = null;
      this.queryCourse();
    } else {
      this.coupon.webinarId = null;
      this.coupon.courseId = null;
    }
  }

  submit(frm: any) {
    this.isSubmitted = true;
    if (!frm.valid || !this.coupon.startTime || !this.coupon.expiredDate) {
      return this.appService.toastError('Invalid form, please try again.');
    }
    if (this.validTime['startTime'] || this.validTime['expiredDate']) {
      return this.appService.toastError(
        'Invalid form, please enter valid date.'
      );
    }
    if (!this.coupon._id) {
      this.couponService.create(this.coupon).then(
        (resp) => {
          this.coupon = resp.data;
          this.appService.toastSuccess('Coupon has been created');
          this.router.navigate(['/users/coupons']);
        },
        (err) => this.appService.toastError(err)
      );
    } else {
      const data = pick(this.coupon, [
        'name',
        'code',
        'type',
        'value',
        'expiredDate',
        'tutorId',
        'webinarId',
        'courseId',
        'active',
        'startTime',
        'limitNumberOfUse',
        'targetType'
      ]);
      this.couponService.update(this.coupon._id, data).then(
        () => {
          this.router.navigate(['/users/coupons']);
          this.appService.toastSuccess('Coupon has been updated');
        },
        (err) => this.appService.toastError(err)
      );
    }
  }
}
