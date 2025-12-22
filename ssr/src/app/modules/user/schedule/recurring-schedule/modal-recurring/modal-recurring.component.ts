import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbDate } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { tObjectOptions } from 'src/app/interface';
import { AppService, CalendarService } from 'src/app/services';

interface IRecurring {
  start: string;
  end: string;
  range: {
    start: Date;
    end: Date;
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
  public validTime = {} as any;
  public tab = 'list';

  constructor(
    private appService: AppService,
    public activeModal: NgbActiveModal,
    private calendarService: CalendarService
  ) {}

  ngOnInit() {
    this.recurring = {
      start: '',
      end: '',
      range: {
        start: new Date(),
        end: new Date()
      },
      dayOfWeek: [],
      isFree: this.isFree
    };
    this.slotDuration =
      typeof this.slotDuration === 'string'
        ? parseInt(this.slotDuration, 10)
        : this.slotDuration;
  }

  selectDate(event: NgbDate, field: string) {
    const date = `${event.day}-${event.month}-${event.year}`;
    const validTimeObject: tObjectOptions = this.validTime;
    const rangeObject: tObjectOptions = this.recurring.range;
    if (
      moment(date, 'DD/MM/YYYY')
        .add(30, 'second')
        .utc()
        .isBefore(moment().set('hour', 0).set('minute', 0).set('second', 0))
    ) {
      validTimeObject[field] = true;
      return this.appService.toastError(
        'Please select end date greater than or equal to the start date'
      );
    }
    validTimeObject[field] = false;
    rangeObject[field] = new Date(
      event.year,
      event.month - 1,
      event.day
    ).toString();
    this.recurring.range = rangeObject as any;
    if (
      this.recurring.range.start &&
      this.recurring.range.end &&
      moment(this.recurring.range.start).isSameOrAfter(
        moment(this.recurring.range.end)
      )
    ) {
      validTimeObject[field] = true;
      return this.appService.toastError(
        'The end date must be greater than the day to start'
      );
    } else {
      this.recurring.range.start = moment(this.recurring.range.start)
        .set('hour', 0)
        .set('minute', 0)
        .set('second', 0)
        .toDate();
      this.recurring.range.end = moment(this.recurring.range.end)
        .set('hour', 23)
        .set('minute', 59)
        .set('second', 59)
        .toDate();
      validTimeObject[field] = false;
    }
    this.validTime = validTimeObject;
  }

  submit(frm: any) {
    try {
      this.isSubmitted = true;
      this.recurring.start = `${this.timeStart.hour}:${this.timeStart.minute}`;
      this.recurring.end = `${this.timeEnd.hour}:${this.timeEnd.minute}`;
      if (
        !frm.valid ||
        !this.recurring.range.start ||
        !this.recurring.range.end
      ) {
        return this.appService.toastError('Invalid form, please try again.');
      }
      if (
        this.timeStart.hour === this.timeEnd.hour &&
        this.timeEnd.minute - this.timeStart.minute < this.slotDuration
      ) {
        return this.appService.toastError(
          `Time allowed is ${this.slotDuration} minutes`
        );
      }
      if (this.timeEnd.hour < this.timeStart.hour) {
        if (this.timeStart.hour !== 23) {
          return this.appService.toastError(
            'Time end must be greater than start time'
          );
        }
      }
      if (this.timeEnd.hour === this.timeStart.hour) {
        if (this.timeStart.minute - this.timeEnd.minute >= 0) {
          return this.appService.toastError(
            'Time end must be greater than start time'
          );
        }
      }
      const minute =
        (moment(moment(this.recurring.end, 'HH:mm').toDate()).unix() -
          moment(moment(this.recurring.start, 'HH:mm').toDate()).unix()) /
        60;
      if (minute > this.slotDuration) {
        return this.appService.toastError(
          `Maximum time allowed is ${this.slotDuration} minutes!`
        );
      }
      this.calendarService.createRecurring(this.recurring).then(
        (resp) => {
          this.appService.toastSuccess('Recurring events have been created');
          this.activeModal.close(resp.data);
        },
        (err) => this.appService.toastError(err)
      );
    } catch (error) {
      this.appService.toastError(error);
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
