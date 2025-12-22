import { Component, OnInit } from '@angular/core';
import { CouponService } from '@services/coupon.service';
import { UtilService } from '@services/util.service';
import { WebinarService } from '@services/webinar.service';
import { TutorService } from '@services/tutor.service';
import { Router } from '@angular/router';
import { CourseService } from '@services/course.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { DatePickerCustomComponent } from '@components/common/date-picker-custom/date-picker-custom.component';
import { IDatePickerOptions } from 'src/interfaces';
import {
  FormControlDirective,
  FormLabelDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  FormDirective,
  RowComponent,
  ColComponent,
  FormFeedbackComponent,
  InputGroupComponent,
} from '@coreui/angular';

import moment from 'moment';
import dayjs, { Dayjs } from 'dayjs';
@Component({
  selector: 'app-create-coupon',
  standalone: true,
  templateUrl: '../form.html',
  imports: [
    CommonModule,
    FormDirective,
    FormControlDirective,
    FormLabelDirective,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    RowComponent,
    ColComponent,
    ReactiveFormsModule,
    FormsModule,
    FormFeedbackComponent,
    InputGroupComponent,
    NgSelectComponent,
    DatePickerCustomComponent,
  ],
})
export class CreateCouponComponent implements OnInit {
  private couponId: string = '';
  public coupon: any = {
    name: '',
    code: '',
    type: 'percent',
    value: 0,
    webinarId: null,
    tutorId: '',
    courseId: null,
    expiredDate: '',
    active: true,
    startTime: '',
    limitNumberOfUse: 0,
    targetType: '',
  };
  public customStylesValidated = false;
  public isSubmitted: Boolean = false;

  public webinars: any = [];
  public courses: any[] = [];
  public searchFields: any = {
    take: 100,
    name: '',
    email: '',
    status: '',
    rating: '',
  };
  public selectedExpired: {
    startDate: Dayjs | string;
    endDate: Dayjs | string;
  } = {
    startDate: dayjs(),
    endDate: dayjs(),
  };
  public selectedStart: { startDate: Dayjs | string; endDate: Dayjs | string } =
    {
      startDate: dayjs(),
      endDate: dayjs(),
    };
  // public datePickerOptions: IDatePickerOptions = {
  //   singleDatePicker: true,
  //   onSelectedDate: this.onSelectedDate.bind(this),
  //   autoApply: false,
  //   closeOnApply: true,
  // };
  public tutor: any = [];

  public validTime: { [key: string]: boolean } = {};
  firstSelectedDate: any = dayjs().startOf('day');
  secondSelectedDate: any = dayjs().startOf('day');
  locale = {
    firstDay: 1,
    startDate: dayjs().startOf('day'),
    endDate: dayjs().endOf('day'),
    format: 'DD.MM.YYYY',
  };
  public getDatePickerOptions(
    field: 'startTime' | 'expiredDate'
  ): IDatePickerOptions {
    return {
      singleDatePicker: true,
      autoApply: false,
      closeOnApply: true,
      onSelectedDate: (event: { startDate: Dayjs; endDate: Dayjs }) => {
        this.selectDate(event, field);
      },
    };
  }
  constructor(
    private router: Router,
    private tutorService: TutorService,
    private courseService: CourseService,
    private webinarService: WebinarService,
    private couponService: CouponService,
    private utilService: UtilService
  ) {}

  ngOnInit(): void {
    const params = Object.assign(this.searchFields);
    this.tutorService.search(params).subscribe({
      next: (resp) => {
        this.tutor = resp.data.items;
      },
    });
  }

  selectTutor(event: any) {
    this.coupon.tutorId = event._id;

    if (this.coupon.targetType === 'webinar') {
      this.queryWebinar();
    } else if (this.coupon.targetType === 'course') {
      this.queryCourse();
    }
  }

  queryWebinar() {
    this.webinarService
      .search({
        take: 100,
        tutorId: this.coupon.tutorId,
      })
      .subscribe((resp) => {
        this.webinars = resp.data.items;
        this.coupon.webinarId =
          this.webinars.length > 0 ? this.webinars[0]._id : null;
        if (
          this.coupon.targetType == 'webinar' &&
          ((this.webinars && this.webinars.length === 0) || !this.webinars)
        ) {
          return this.utilService.toastError({
            title: 'Errors',
            message: 'error',
          });
        }
      });
  }
  queryCourse() {
    this.courseService
      .search({ take: 100, tutorId: this.coupon.tutorId })
      .subscribe((resp) => {
        this.courses = resp.data.items;
        this.coupon.courseId =
          this.courses.length > 0 ? this.courses[0]._id : null;
        if ((this.courses && this.courses.length === 0) || !this.courses) {
          return this.utilService.toastError({
            title: 'Errors',
            message: 'error',
          });
        }
      });
  }

  selectDate(event: any, field: 'startTime' | 'expiredDate') {
    // console.log(event);
    const ngDate = {
      year: event.startDate.$y,
      month: event.startDate.$M + 1,
      day: event.startDate.$D,
    };

    const date = `${ngDate.day}/${ngDate.month}/${ngDate.year}`;

    if (
      moment(date, 'DD/MM/YYYY')
        .add(30, 'second')
        .utc()
        .isBefore(moment().set('hour', 0).set('minute', 0).set('second', 0))
    ) {
      this.validTime[field] = true;
      return this.utilService.toastError({
        title: 'Errors',
        message: 'error',
      });
    }

    this.validTime[field] = false;
    this.coupon[field] = new Date(
      ngDate.year,
      ngDate.month - 1,
      ngDate.day
    ).toString();

    if (
      field === 'expiredDate' &&
      this.coupon.startTime &&
      this.coupon.expiredDate &&
      moment(this.coupon.startTime).isAfter(moment(this.coupon.expiredDate))
    ) {
      this.validTime[field] = true;
      return this.utilService.toastError({
        title: 'Errors',
        message: 'error',
      });
    } else {
      this.coupon.expiredDate = moment(this.coupon.expiredDate)
        .set('hour', 23)
        .set('minute', 59)
        .set('second', 59)
        .toDate();
      this.validTime[field] = false;
    }
  }

  submit(frm: any): void {
    if (this.isSubmitted) {
      return this.utilService.toastError({
        title: 'error',
        message: 'Oops! You missed a required field',
      });
    }

    this.customStylesValidated = true;
    if (!frm.valid || !this.coupon.startTime || !this.coupon.expiredDate) {
      return this.utilService.toastError({
        title: 'Errors',
        message: 'Invalid form, please enter valid date.',
      });
    }
    if (this.validTime['startTime'] || this.validTime['expiredDate']) {
      return this.utilService.toastError({
        title: 'Errors',
        message: 'Invalid form, please enter valid date.',
      });
    }
    if (
      this.coupon.targetType === 'webinar' &&
      (!this.coupon.tutorId || !this.coupon.webinarId)
    ) {
      return this.utilService.toastError({
        title: 'Errors',
        message: 'Please select tutor and webinar.',
      });
    }
    this.isSubmitted = true;

    this.couponService.create(this.coupon).subscribe(() => {
      this.utilService.toastSuccess({
        title: 'Success',
        message: 'Coupon has been updated',
      });
      this.router.navigate(['/coupon/list']);
    });
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
}
