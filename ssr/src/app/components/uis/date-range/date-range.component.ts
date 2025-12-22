import { Component, Output, EventEmitter } from '@angular/core';
import { NgbDate, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
@Component({
  selector: 'app-date-range',
  templateUrl: './date-range.html'
})
export class DateRangeComponent {
  @Output() dateChange = new EventEmitter();
  isShow: Boolean = false;
  hoveredDate: NgbDate;
  fromDate: NgbDate;
  toDate: NgbDate;
  dateRange: any = {};
  outsideDays = 'visible';
  showDates: any = '';
  startDate: any;
  endDate: any;

  // selected: any;
  alwaysShowCalendars: boolean;
  ranges: any = {
    Today: [moment(), moment()],
    Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
  };
  invalidDates: moment.Moment[] = [moment().add(2, 'days'), moment().add(3, 'days'), moment().add(5, 'days')];
  locale = {
    format: 'MM/DD/YYYY', // could be 'YYYY-MM-DDTHH:mm:ss.SSSSZ'
    displayFormat: 'MM/DD/YYYY', // default is format value
    direction: 'ltr', // could be rtl
    weekLabel: 'W',
    separator: ' - ', // default is ' - '
    cancelLabel: 'Cancel', // detault is 'Cancel'
    applyLabel: 'Okay', // detault is 'Apply'
    clearLabel: '', // detault is 'Clear'
    customRangeLabel: 'Custom range',
    firstDay: 1 // first day is monday
  };
  isInvalidDate = (m: moment.Moment) => {
    return this.invalidDates.some(d => d.isSame(m, 'day'));
  };

  constructor(calendar: NgbCalendar) {
    this.fromDate = calendar.getToday();
    this.alwaysShowCalendars = true;
  }

  toggle() {
    this.isShow = !this.isShow;
  }

  onDateSelection(date: any) {
    if (date.startDate && date.endDate) {
      return this.dateChange.emit({
        from: moment(new Date(date.startDate)).toISOString(),
        to: moment(new Date(date.endDate)).toISOString()
      });
    }
    this.dateChange.emit(null);
  }

  isHovered(date: NgbDate) {
    return (
      this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate)
    );
  }

  isInside(date: NgbDate) {
    return date.after(this.fromDate) && date.before(this.toDate);
  }

  isRange(date: NgbDate) {
    return date.equals(this.fromDate) || date.equals(this.toDate) || this.isInside(date) || this.isHovered(date);
  }
}
