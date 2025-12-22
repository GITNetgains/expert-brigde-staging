import { Component } from '@angular/core';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import dayjs, { Dayjs } from 'dayjs';
import { NgxDaterangepickerBootstrapDirective } from 'ngx-daterangepicker-bootstrap';
import { DatePipe } from '@angular/common';

export function formatDate(date: any, format: string): string {
  return new DatePipe('en-US').transform(date, format)!.toString();
}

@Component({
  selector: 'app-daterangepicker-field-type',
  template: `
    <div class="input-group mb-1">
      <input
        type="text"
        class="form-control"
        style="box-shadow: none; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;"
        [formlyAttributes]="field"
        ngxDaterangepickerBootstrap
        [drops]="drops"
        [opens]="opens"
        [locale]="locale"
        [formlyCustomField]="true"
        [timePickerSeconds]="true"
        [timePicker24Hour]="true"
        [showCancel]="true"
        [linkedCalendars]="true"
        [alwaysShowCalendars]="true"
        [showRangeLabelOnInput]="false"
        [keepCalendarOpeningWithRange]="false"
        [isTooltipDate]="isTooltipDate"
        [isCustomDate]="isCustomDate"
        [isInvalidDate]="isInvalidDate"
        (datesUpdated)="datesUpdated($event)"
      />
    </div>
  `,
  imports: [FormlyModule, NgxDaterangepickerBootstrapDirective],
})
export class DaterangepickerFieldType extends FieldType<FieldTypeConfig> {
  drops: string = 'down';
  opens: string = 'right';
  maxDate: Dayjs;
  minDate: Dayjs;
  invalidDates: Dayjs[] = [];
  locale: {
    firstDay: number;
    startDate: Dayjs;
    endDate: Dayjs;
    format: string;
    applyLabel: string;
    cancelLabel: string;
    fromLabel: string;
    toLabel: string;
  } = {
    firstDay: 1,
    startDate: dayjs().startOf('day'),
    endDate: dayjs().endOf('day'),
    format: 'DD.MM.YYYY',
    applyLabel: 'Apply',
    cancelLabel: 'Cancel',
    fromLabel: 'From',
    toLabel: 'To',
  };
  tooltips: { date: Dayjs; text: string }[] = [
    { date: dayjs(), text: 'Today is just unselectable' },
    { date: dayjs().add(2, 'days'), text: 'Yeeeees!!!' },
  ];

  constructor() {
    super();
    this.maxDate = dayjs().add(2, 'weeks');
    this.minDate = dayjs().subtract(3, 'days');
  }

  public datesUpdated($event: any): void {
    this.field.model['dateRange'].start = formatDate(
      $event.startDate,
      'yyyy-MM-dd HH:mm:ss'
    );
    this.field.model['dateRange'].end = formatDate(
      $event.endDate,
      'yyyy-MM-dd HH:mm:ss'
    );
    this.field.model['dateRange'].label = $event.label;
    this.field.props.label = $event.label;
    if (this.props['selectedDate']) this.props['selectedDate']($event);
  }

  isInvalidDate: (m: Dayjs) => boolean = (m: Dayjs): boolean => {
    return this.invalidDates.some((d: Dayjs): boolean => d.isSame(m, 'day'));
  };

  isCustomDate: (date: Dayjs) => string | boolean = (
    date: Dayjs
  ): boolean | string => {
    return date.day() === 0 || date.day() === 6 ? 'mycustomdate' : false;
  };

  isTooltipDate: (m: Dayjs) => string | boolean = (
    m: Dayjs
  ): boolean | string => {
    const tooltip: { date: Dayjs; text: string } | undefined =
      this.tooltips.find((tt: { date: Dayjs; text: string }): boolean =>
        tt.date.isSame(m, 'day')
      );
    return tooltip ? tooltip.text : false;
  };
}
