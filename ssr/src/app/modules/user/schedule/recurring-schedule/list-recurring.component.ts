import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { CalendarService } from 'src/app/services';
@Component({
  selector: 'app-recurring-list',
  templateUrl: './list.html'
})
export class ListRecurringScheduleComponent implements OnInit {
  @Input() isFree = false;
  public loading = false;
  public filter = {
    currentPage: 1,
    pageSize: 10,
    sortOption: {
      sortBy: 'createdAt',
      sortType: 'desc'
    },
    total: 0
  };
  public recurring: any[] = [];

  public dayOfWeek = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    0: 'Sunday'
  };
  constructor(
    private readonly calendarService: CalendarService,
    private toast: ToastrService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.loadListSchedule();
  }

  loadListSchedule() {
    this.loading = true;
    const params = Object.assign({
      page: this.filter.currentPage,
      take: this.filter.pageSize,
      sort: `${this.filter.sortOption.sortBy}`,
      sortType: `${this.filter.sortOption.sortType}`,
      isFree: this.isFree
    });
    this.calendarService
      .loadListRecurring(params)
      .then(resp => {
        const { items, count } = resp.data;
        if (items && items.length > 0) {
          this.recurring = items;
          this.filter.total = count;
        }
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
        this.toast.error('Can not get recurring!');
      });
  }

  sortBy(field: string, type: string) {
    this.filter.sortOption.sortBy = field;
    this.filter.sortOption.sortType = type;
    this.loadListSchedule();
  }

  onSort(evt: any) {
    this.filter.sortOption = evt;
    this.loadListSchedule();
  }

  renderDayOfWeek(dayOfWeek: number[]) {
    return dayOfWeek.map((item) => {
      const itemDay: { [key: string]: any } = this.dayOfWeek;
      return itemDay[item];
    }).join(', ');
  }

  renderTime(time: any) {
    const hour = moment(time, 'HH:mm').toDate().getHours();
    const minute = moment(time, 'HH:mm').toDate().getMinutes();

    return `${hour.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false })}:${minute.toLocaleString(
      'en-US',
      { minimumIntegerDigits: 2, useGrouping: false }
    )}`;
  }

  remove(item: any, index: number) {
    this.calendarService
      .removeRecurring(item._id)
      .then(() => {
        this.toast.success(this.translate.instant(this.translate.instant('Recurring has been deleted!')));
        this.recurring.splice(index, 1);
      })
      .catch(e => this.toast.error(this.translate.instant(e.data.data.message)));
  }
}
