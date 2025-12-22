import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { pick } from 'lodash-es';
import { UtilService, CouponService } from 'src/services';
import dayjs, { Dayjs } from 'dayjs';
import {
  ButtonDirective,
  CardComponent,
  CardBodyComponent,
  FormModule,
  GridModule,
  FormFeedbackComponent,
  InputGroupComponent,
  FormLabelDirective,
  FormControlDirective,
  FormDirective,
} from '@coreui/angular';
import { DatePickerCustomComponent } from '@components/common/date-picker-custom/date-picker-custom.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { IDatePickerOptions } from 'src/interfaces';

@Component({
  selector: 'course-coupon',
  templateUrl: './course-coupon.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    CardBodyComponent,
    ButtonDirective,
    FormModule,
    GridModule,
    FormFeedbackComponent,
    FormLabelDirective,
    FormControlDirective,
    InputGroupComponent,
    FormDirective,
    NgSelectModule,
    DatePickerCustomComponent,
    RouterModule,
  ],
})
export class CourseCouponComponent implements OnInit {
  @Input() course: any;
  @Input() tutorId: string = '';
  @Output() onTabSelect = new EventEmitter<number>();

  private utilService = inject(UtilService);
  private couponService = inject(CouponService);
  private route = inject(ActivatedRoute);

  @Input() coupon: any = {
    name: '',
    code: '',
    type: 'percent',
    value: 0,
    courseId: '',
    tutorId: '',
    expiredDate: '',
    active: true,
    startTime: '',
    limitNumberOfUse: 0,
    targetType: 'course',
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
  public isSubmitted: boolean = false;
  public customStylesValidated: boolean = false;
  public type: string = 'percent';
  public config: any;
  public validTime: { [key: string]: boolean } = {};
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
  ngOnInit() {
    this.config = this.route.snapshot.data['appConfig'];
    this.coupon.tutorId = this.tutorId;
    if (this.course && this.course._id) {
      this.coupon.courseId = this.course._id;
      this.getCurrentCoupon();
    }
  }

  getCurrentCoupon() {
    this.couponService
      .getCurrentCoupon({
        targetType: 'course',
        courseId: this.coupon.courseId,
        tutorId: this.tutorId,
      })
      .subscribe({
        next: (resp: any) => {
          if (resp && resp.data) {
            this.coupon = resp.data;
            const startTime = new Date(this.coupon.startTime);
            const expiredDate = new Date(this.coupon.expiredDate);
            this.selectedStart = {
              startDate: dayjs(this.coupon.startTime),
              endDate: dayjs(this.coupon.startTime),
            };
            this.selectedExpired = {
              startDate: dayjs(this.coupon.expiredDate),
              endDate: dayjs(this.coupon.expiredDate),
            };
          }
        },
        error: (err: any) => {
          this.utilService.toastError({
            title: 'Error',
            message: err.data?.message || 'Failed to get coupon',
          });
        },
      });
  }

  selectDate(event: any, field: 'startTime' | 'expiredDate') {
    const selectedDate = dayjs(event.startDate);
    const today = dayjs().startOf('day');

    if (selectedDate.isBefore(today)) {
      this.validTime[field] = true;
      return this.utilService.toastError({
        title: 'Error',
        message: 'Please select date greater than or equal to the current date',
      });
    }

    this.validTime[field] = false;
    this.coupon[field] = new Date(
      selectedDate.year(),
      selectedDate.month(),
      selectedDate.date()
    ).toString();

    if (
      field === 'expiredDate' &&
      this.coupon.startTime &&
      this.coupon.expiredDate &&
      dayjs(this.coupon.startTime).isAfter(dayjs(this.coupon.expiredDate))
    ) {
      this.validTime[field] = true;
      return this.utilService.toastError({
        title: 'Error',
        message: 'The expiration date must be greater than the start date',
      });
    } else {
      this.coupon.expiredDate = dayjs(this.coupon.expiredDate)
        .hour(23)
        .minute(59)
        .second(59)
        .toDate();
      this.validTime[field] = false;
    }
  }

  submit(frm: any) {
    this.isSubmitted = true;
    this.customStylesValidated = true;
    this.coupon.type = this.type;

    if (!frm.valid || !this.coupon.startTime || !this.coupon.expiredDate) {
      return this.utilService.toastError({
        title: 'Error',
        message: 'Invalid form, please try again.',
      });
    }

    if (this.validTime['startTime'] || this.validTime['expiredDate']) {
      return this.utilService.toastError({
        title: 'Error',
        message: 'Invalid form, please enter valid date.',
      });
    }

    if (!this.coupon._id) {
      this.couponService.create(this.coupon).subscribe({
        next: () => {
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'Coupon has been created',
          });
        },
        error: (err: any) => {
          this.utilService.toastError({
            title: 'Error',
            message: err.data?.message || 'Something went wrong!',
          });
        },
      });
    } else {
      const data = pick(this.coupon, [
        'name',
        'code',
        'type',
        'value',
        'expiredDate',
        'courseId',
        'tutorId',
        'active',
        'startTime',
        'limitNumberOfUse',
        'targetType',
      ]);

      this.couponService.update(this.coupon._id, data).subscribe({
        next: () => {
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'Coupon has been updated',
          });
        },
        error: (err: any) => {
          this.utilService.toastError({
            title: 'Error',
            message: err.data?.message || 'Something went wrong!',
          });
        },
      });
    }
  }

  onTab(tab: number) {
    this.onTabSelect.emit(tab);
  }
}
