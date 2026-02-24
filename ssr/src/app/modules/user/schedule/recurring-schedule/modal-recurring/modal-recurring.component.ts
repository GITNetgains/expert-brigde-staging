import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbDate, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { AppService, CalendarService } from 'src/app/services';

interface IRecurring {
  start: string;
  end: string;
  range: {
    start: Date | null;
    end: Date | null;
  };
  isFree: boolean;
  dayOfWeek: Array<number>;
}

@Component({
  selector: 'app-recurring-from',
  templateUrl: './modal-recurring.html',
  styleUrls: ['./recurring.scss']
})
export class RecurringFormComponent implements OnInit {
  @Input() isFree = false;
  @Input() slotDuration = 40;
  public recurring: IRecurring;
  public dayOfWeek = [
    {
      name: 'Monday',
      index: 1
    },
    {
      name: 'Tuesday',
      index: 2
    },
    {
      name: 'Wednesday',
      index: 3
    },
    {
      name: 'Thursday',
      index: 4
    },
    {
      name: 'Friday',
      index: 5
    },
    {
      name: 'Saturday',
      index: 6
    },
    {
      name: 'Sunday',
      index: 0
    }
  ];
  timeStart = { hour: 0, minute: 0 };
  timeEnd = { hour: 0, minute: 0 };
  public range = {
    start: {
      day: 0,
      month: 0,
      year: 0
    },
    end: {
      day: 0,
      month: 0,
      year: 0
    }
  };
  public isSubmitted: Boolean = false;
  public validTime: { start?: boolean; end?: boolean } = {};
  public dateErrorMessages: { start: string; end: string } = { start: '', end: '' };
  public tab = 'list';
  public minDate: NgbDateStruct = { year: 2022, month: 1, day: 1 };

  get hasStartDateError(): boolean {
    return !this.recurring?.range?.start || !this.isRangeStartSelected();
  }

  get hasEndDateError(): boolean {
    return !this.recurring?.range?.end || !this.isRangeEndSelected();
  }

  private isRangeStartSelected(): boolean {
    const r = this.range?.start;
    return !!(r && typeof r === 'object' && 'day' in r && r.day && 'year' in r && r.year);
  }

  private isRangeEndSelected(): boolean {
    const r = this.range?.end;
    return !!(r && typeof r === 'object' && 'day' in r && r.day && 'year' in r && r.year);
  }

  constructor(
    private appService: AppService,
    public activeModal: NgbActiveModal,
    private calendarService: CalendarService
  ) {}

  ngOnInit() {
    const today = moment();
    this.minDate = {
      year: today.year(),
      month: today.month() + 1,
      day: today.date()
    };
    this.recurring = {
      start: '',
      end: '',
      range: {
        start: null,
        end: null
      },
      dayOfWeek: [],
      isFree: this.isFree
    };
    this.slotDuration =
      typeof this.slotDuration === 'string'
        ? parseInt(this.slotDuration, 10)
        : this.slotDuration;
  }

  selectDate(event: NgbDate, field: 'start' | 'end') {
    if (!event || event.day === undefined) {
      return;
    }
    const dateStr = `${event.day}-${event.month}-${event.year}`;
    const selectedMoment = moment(dateStr, 'D-M-YYYY');
    if (!selectedMoment.isValid()) {
      this.validTime[field] = true;
      this.dateErrorMessages[field] = 'Please enter a valid date.';
      return;
    }
    const todayStart = moment().set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0);
    if (selectedMoment.isBefore(todayStart)) {
      this.validTime[field] = true;
      this.dateErrorMessages[field] = field === 'start'
        ? 'Start date must be today or a future date.'
        : 'End date must be today or a future date.';
      if (field === 'start') {
        this.range.start = { day: event.day, month: event.month, year: event.year };
      } else {
        this.range.end = { day: event.day, month: event.month, year: event.year };
      }
      return;
    }
    const dateObj = new Date(event.year, event.month - 1, event.day);
    if (field === 'start') {
      this.range.start = { day: event.day, month: event.month, year: event.year };
      this.recurring.range.start = moment(dateObj).set('hour', 0).set('minute', 0).set('second', 0).toDate();
    } else {
      this.range.end = { day: event.day, month: event.month, year: event.year };
      this.recurring.range.end = moment(dateObj).set('hour', 23).set('minute', 59).set('second', 59).toDate();
    }
    if (
      this.recurring.range.start &&
      this.recurring.range.end &&
      moment(this.recurring.range.start).isSameOrAfter(moment(this.recurring.range.end))
    ) {
      this.validTime[field] = true;
      this.dateErrorMessages[field] = 'End date must be after the start date.';
      return;
    }
    this.validTime[field] = false;
    this.dateErrorMessages[field] = '';
    if (this.recurring.range.start && this.recurring.range.end && moment(this.recurring.range.start).isBefore(moment(this.recurring.range.end))) {
      this.validTime.start = false;
      this.validTime.end = false;
      this.dateErrorMessages.start = '';
      this.dateErrorMessages.end = '';
    }
    if (this.recurring.range.start) {
      this.recurring.range.start = moment(this.recurring.range.start).set('hour', 0).set('minute', 0).set('second', 0).toDate();
    }
    if (this.recurring.range.end) {
      this.recurring.range.end = moment(this.recurring.range.end).set('hour', 23).set('minute', 59).set('second', 59).toDate();
    }
  }

  submit(frm: any) {
    try {
      this.isSubmitted = true;
      const startStr = `${this.timeStart?.hour ?? 0}:${this.timeStart?.minute ?? 0}`;
      const endStr = `${this.timeEnd?.hour ?? 0}:${this.timeEnd?.minute ?? 0}`;
      this.recurring.start = startStr;
      this.recurring.end = endStr;

      if (!frm.valid || !this.recurring.range.start || !this.recurring.range.end) {
        return this.appService.toastError('Please fill all required fields: start/end time, days of week, and date range.');
      }
      if (!this.recurring.dayOfWeek || this.recurring.dayOfWeek.length === 0) {
        return this.appService.toastError('Please select at least one day of the week.');
      }
      if (this.timeEnd.hour < this.timeStart.hour) {
        return this.appService.toastError('End time must be after start time.');
      }
      if (this.timeEnd.hour === this.timeStart.hour && this.timeEnd.minute <= this.timeStart.minute) {
        return this.appService.toastError('End time must be after start time.');
      }

      const startMoment = moment(this.recurring.start, ['HH:mm', 'H:m'], true);
      const endMoment = moment(this.recurring.end, ['HH:mm', 'H:m'], true);
      if (!startMoment.isValid() || !endMoment.isValid()) {
        return this.appService.toastError('Please enter valid start and end times.');
      }
      const startDate = startMoment.toDate();
      const endDate = endMoment.toDate();
      if (typeof startDate.getTime !== 'function' || typeof endDate.getTime !== 'function') {
        return this.appService.toastError('Invalid time format. Please try again.');
      }
      const minute = (endMoment.unix() - startMoment.unix()) / 60;
      if (minute < this.slotDuration) {
        return this.appService.toastError(
          `Each slot must be at least ${this.slotDuration} minutes.`
        );
      }

      // Prevent booking past slots: if start date is today, start time must be in the future
      const rangeStart = moment(this.recurring.range.start).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0);
      const slotStartDateTime = moment(this.recurring.range.start)
        .set('hour', this.timeStart.hour)
        .set('minute', this.timeStart.minute)
        .set('second', 0)
        .set('millisecond', 0);
      const now = moment();
      if (rangeStart.isSame(now, 'day') && slotStartDateTime.isSameOrBefore(now)) {
        return this.appService.toastError('You cannot book past time slots. Please select a start date/time that is in the future.');
      }

      // Send payload with explicit ISO date strings so backend never receives undefined or invalid dates
      const toDate = (v: Date | { year: number; month: number; day: number } | string | null): Date | null => {
        if (!v) return null;
        if (v instanceof Date) return v;
        if (typeof v === 'object' && 'year' in v && 'month' in v && 'day' in v) {
          return new Date((v as { year: number; month: number; day: number }).year, (v as { year: number; month: number; day: number }).month - 1, (v as { year: number; month: number; day: number }).day);
        }
        return moment(v).toDate();
      };
      const rangeStartDate = toDate(this.recurring.range.start);
      const rangeEndDate = toDate(this.recurring.range.end);
      if (!rangeStartDate || !rangeEndDate) {
        return this.appService.toastError('Please fill all required fields: start/end time, days of week, and date range.');
      }
      const payload = {
        ...this.recurring,
        range: {
          start: rangeStartDate.toISOString(),
          end: rangeEndDate.toISOString()
        }
      };

      this.calendarService.createRecurring(payload).then(
        (resp) => {
          const overlapSlots =
            resp &&
            resp.data &&
            resp.data.dataSlots &&
            Array.isArray(resp.data.dataSlots.overlapSlots)
              ? resp.data.dataSlots.overlapSlots.length
              : 0;

          if (overlapSlots > 0) {
            const message =
              overlapSlots === 1
                ? '1 of the generated slots overlaps with an existing booking in your timeline and was not created.'
                : `${overlapSlots} of the generated slots overlap with existing bookings in your timeline and were not created.`;
            this.appService.toastError(message);
          } else {
            this.appService.toastSuccess('Recurring events have been created');
          }

          this.activeModal.close(resp.data);
        },
        (err) => this.appService.toastError(err)
      );
    } catch (error) {
      const msg = error && typeof error === 'object' && 'message' in error ? (error as Error).message : String(error);
      this.appService.toastError(msg || 'Something went wrong. Please try again.');
      this.activeModal.close(null);
    }
  }

  close(data: any) {
    this.activeModal.close(data);
  }

  changeTab(tab: string) {
    this.tab = tab;
  }
}
