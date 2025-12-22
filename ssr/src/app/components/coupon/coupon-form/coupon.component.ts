import { Injectable } from '@angular/core';
import {
  NgbDate,
  NgbDateParserFormatter,
  NgbDateStruct,
  NgbDatepickerModule
} from '@ng-bootstrap/ng-bootstrap';

function padNumber(value: number) {
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

import { Component, OnInit, Input } from '@angular/core';
import * as moment from 'moment';
import * as _ from 'lodash';
import { TranslateModule } from '@ngx-translate/core';
import { ICoupon, ICourse, IUser, IWebinar } from 'src/app/interface';
import { AppService, CouponService } from 'src/app/services';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-coupon',
  templateUrl: './coupon-form.html',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, NgbDatepickerModule]
})
export class CouponComponent implements OnInit {
  @Input() tutorId: string;
  @Input() webinar: IWebinar;
  @Input() course: ICourse;
  @Input() targetType: string;
  @Input() coupon: any = {
    name: '',
    code: '',
    type: 'percent',
    value: 0,
    webinarId: null,
    courseId: null,
    tutorId: '',
    expiredDate: '',
    active: true,
    startTime: '',
    limitNumberOfUse: 0,
    targetType: ''
  };
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
  constructor(
    private appService: AppService,
    private couponService: CouponService
  ) {}

  ngOnInit() {
    if (this.tutorId) {
      this.coupon.tutorId = this.tutorId;
    }
    if (this.webinar && this.webinar._id) {
      this.coupon.webinarId = this.webinar._id;
    }
    if (this.course && this.course._id) {
      this.coupon.courseId = this.course._id;
    }
    if (this.targetType) {
      this.coupon.targetType = this.targetType;
      this.getCurrentCoupon();
    }
  }

  getCurrentCoupon() {
    this.couponService
      .getCurrentCoupon({
        targetType: this.targetType,
        webinarId: this.coupon.webinarId || '',
        tutorId: this.coupon.tutorId || '',
        courseId: this.coupon.courseId || ''
      })
      .then((resp) => {
        if (resp && resp.data) {
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
        }
      });
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
        },
        (err) => this.appService.toastError(err)
      );
    } else {
      const data = _.pick(this.coupon, [
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
          this.appService.toastSuccess('Coupon has been updated');
        },
        (err) => this.appService.toastError(err)
      );
    }
  }
}
