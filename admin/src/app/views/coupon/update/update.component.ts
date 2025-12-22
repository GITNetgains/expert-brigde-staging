import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CouponService } from '@services/coupon.service';
import { UtilService } from '@services/util.service';
import { WebinarService } from '@services/webinar.service';
import { TutorService } from '@services/tutor.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CourseService } from '@services/course.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { DatePickerCustomComponent } from '@components/common/date-picker-custom/date-picker-custom.component';
import { IDatePickerOptions } from 'src/interfaces';
import { pick } from 'lodash-es';
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
  selector: 'app-update-coupon',
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
export class UpdateCouponComponent implements OnInit {
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
  public form!: FormGroup;
  private couponId: string = '';
  public courses: any[] = [];
  public tutor: any[] = [];
  public searchFields: any = {
    take: 100,
    name: '',
    email: '',
    status: '',
    rating: '',
  };
  public webinars: any[] = [];
  public selectedCourses: any[] = [];
  public selectedTutors: any[] = [];
  public selectedWebinars: any[] = [];
  public isSubmitted: Boolean = false;
  public customStylesValidated = false;
  public loadingCourses = false;
  public loadingTutors = false;
  public loadingWebinars = false;
  public validTime: { [key: string]: boolean } = {};
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
    private couponService: CouponService,
    private utilService: UtilService,
    private webinarService: WebinarService,
    private tutorService: TutorService,
    private router: Router,
    private courseService: CourseService
  ) {}
  ngOnInit(): void {
    this.couponId = this.router.url.split('/').pop() || '';
    // console.log(this.couponId);
    const params = Object.assign(this.searchFields);
    this.tutorService.search(params).subscribe({
      next: (resp) => {
        this.tutor = resp.data.items;
      },
    });
    this.couponService.findOne(this.couponId).subscribe((resp) => {
      this.coupon = resp.data;
      console.log(this.coupon);
      this.coupon.startTime = new Date(this.coupon.startTime);
      this.coupon.expiredDate = new Date(this.coupon.expiredDate);
      this.coupon = pick(resp.data, [
        'name',
        'code',
        'type',
        'value',
        'webinarId',
        'tutorId',
        'courseId',
        'expiredDate',
        'active',
        'startTime',
        'limitNumberOfUse',
        'targetType',
      ]);
      this.selectedStart = {
        startDate: dayjs(this.coupon.startTime),
        endDate: dayjs(this.coupon.startTime),
      };
      this.selectedExpired = {
        startDate: dayjs(this.coupon.expiredDate),
        endDate: dayjs(this.coupon.expiredDate),
      };
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
    console.log(event);
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
      // console.log('validTime', this.validTime);
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
    // console.log('this.coupon', this.coupon);

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
    this.couponService.update(this.couponId, this.coupon).subscribe(() => {
      this.utilService.toastSuccess({
        title: 'Error',
        message: 'Coupon has been created',
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
