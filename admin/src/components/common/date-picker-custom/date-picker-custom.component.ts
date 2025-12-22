import {
  AfterViewInit,
  Component,
  Input,
  OnInit,
  ViewChild,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import {
  NgxDaterangepickerBootstrapDirective,
  NgxDaterangepickerBootstrapModule,
  NgxDaterangepickerBootstrapComponent,
} from 'ngx-daterangepicker-bootstrap';
import dayjs, { Dayjs } from 'dayjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IDatePickerOptions } from 'src/interfaces';

const initialOptions = {
  locale: 'en',
  singleDatePicker: false,
  format: 'DD/MM/YYYY',
  name: 'date_range',
  autoApply: false,
};

@Component({
  selector: 'app-date-picker-custom',
  templateUrl: './date-picker-custom.component.html',
  styleUrls: ['./date-picker-custom.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    NgxDaterangepickerBootstrapModule,
    NgxDaterangepickerBootstrapComponent,
  ],
  standalone: true,
})
export class DatePickerCustomComponent implements OnInit, AfterViewInit {
  @Input() options!: IDatePickerOptions;
  @Input() defaultValue!: {
    startDate: Dayjs | string;
    endDate: Dayjs | string;
  };
  selected: { startDate: Dayjs; endDate: Dayjs } = {
    startDate: dayjs(),
    endDate: dayjs(),
  };

  public locale = {
    applyLabel: 'Apply',
    format: 'DD/MM/YYYY',
  };
  open = false;

  dateValue = 'Select Date';

  constructor() {
    if (!this.options) {
      this.options = initialOptions;
    } else {
      this.options = { ...initialOptions, ...this.options };
    }
  }
  @ViewChild(NgxDaterangepickerBootstrapComponent, { static: false })
  pickerDirective!: NgxDaterangepickerBootstrapComponent;

  ngOnInit(): void {
    if (this.defaultValue) {
      this.selected.startDate =
        typeof this.defaultValue.startDate === 'string'
          ? dayjs(this.defaultValue.startDate)
          : this.defaultValue.startDate;
      this.selected.endDate =
        typeof this.defaultValue.endDate === 'string'
          ? dayjs(this.defaultValue.endDate)
          : this.defaultValue.endDate;
    }
  }

  ngAfterViewInit(): void {
    this.pickerDirective.setStartDate(this.selected.startDate);
    this.pickerDirective.setEndDate(this.selected.endDate);
    setTimeout(() => {
      this.dateValue = this.pickerDirective.chosenLabel || 'Select Date';
    });
  }

  openDatepicker() {
    this.open = !this.open;
  }

  chosenDate(event: {
    startDate: Dayjs;
    endDate: Dayjs;
    chosenLabel?: string;
  }) {
    this.dateValue = event.chosenLabel || 'Select Date';
    if (this.options.onSelectedDate) {
      this.options.onSelectedDate(event);
    }
    if (this.options.closeOnApply) {
      this.open = false;
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['defaultValue'] && changes['defaultValue'].currentValue) {
      const newValue = changes['defaultValue'].currentValue;
      this.selected.startDate =
        typeof newValue.startDate === 'string'
          ? dayjs(newValue.startDate)
          : newValue.startDate;
      this.selected.endDate =
        typeof newValue.endDate === 'string'
          ? dayjs(newValue.endDate)
          : newValue.endDate;
      if (this.pickerDirective) {
        this.pickerDirective.setStartDate(this.selected.startDate);
        this.pickerDirective.setEndDate(this.selected.endDate);
        this.dateValue = this.pickerDirective.chosenLabel || 'Select Date';
      }
    }
  }
}
