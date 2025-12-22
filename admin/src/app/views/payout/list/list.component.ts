import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePickerCustomComponent } from '@components/common/date-picker-custom/date-picker-custom.component';
import { SortComponent } from '@components/common/sort/sort.component';
import { EyeIconComponent } from '@components/common/icons/eye-icon/eye-icon.component';
import {
  BadgeComponent,
  BorderDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  ContainerComponent,
  FormSelectDirective,
  GutterDirective,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { ChartjsComponent } from '@coreui/angular-chartjs';
import { NgSelectComponent } from '@ng-select/ng-select';
import { RequestPayoutService } from '@services/request-payout.service';
import { TutorService } from '@services/tutor.service';
import { UtilService } from '@services/util.service';
import { type ChartData } from 'chart.js';
import { Dayjs } from 'dayjs';
import { of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
import { IDatePickerOptions, ISortOption } from 'src/interfaces';

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.component.html',
  styles: [`
    .chart-legend {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
      height: 100%;
      padding-left: 10px;
      padding-top: 0;
    }
    .chart-legend .legend-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      font-size: 10px;
      line-height: 1.5;
    }
    .chart-legend .legend-color {
      width: 25px;
      height: 12px;
      border-radius: 2px;
      margin-right: 8px;
      display: inline-block;
    }
    .chart-legend .legend-label {
      color: #888;
      font-weight: normal;
    }
    c-chart {
      height: 200px;
      display: block;
    }

    @media (max-width: 768px) {
      .chart-legend {
        padding-top: 1rem;
        padding-left: 0;
        flex-direction: row;
        justify-content: center;
        flex-wrap: wrap;
      }

      .chart-legend .legend-item {
        margin-right: 1rem;
        margin-bottom: 0.5rem;
      }
    }
  `],
  imports: [
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    CommonModule,
    ButtonDirective,
    CommonModule,
    TableDirective,
    BorderDirective,
    RouterLink,
    ChartjsComponent,
    GutterDirective,
    ReactiveFormsModule,
    SortComponent,
    BadgeComponent,
    FormsModule,
    FormSelectDirective,
    NgSelectComponent,
    DatePickerCustomComponent,
    GutterDirective,
    EyeIconComponent,
  ],
})
export class ListComponent implements OnInit {
  items: any[] = [];
  page = 1;
  take = 10;
  total = 0;
  currentPage: number = 1;
  searchFields: any = {
    status: '',
  };
  sortOption: ISortOption = {
    sortBy: 'createdAt',
    sortType: 'desc',
  };
  dateFilter: any = {};
  stats: any;
  tutorId: any;
  searching = false;
  searchFailed = false;
  config: any;
  loading = false;
  tutorInput$ = new Subject<string>();
  tutorItems: any[] = [];
  searchTutor: any = { take: 10 };
  searchUser: any = { take: 10 };
  tutor: any = [];
  user: any = [];

  private route = inject(ActivatedRoute);
  private toasty = inject(UtilService);
  private tutorService = inject(TutorService);
  private payoutService = inject(RequestPayoutService);

  ngOnInit() {
    this.config = this.route.snapshot.data['appConfig'];
    this.initSearchStreams();
    this.query();
    this.queryStats();
  }

  initSearchStreams() {
    this.tutorInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.searching = true)),
        switchMap((term) =>
          this.tutorService.search({ name: term }).pipe(
            map((resp: any) => resp.data.items),
            catchError(() => of([])),
            tap(() => (this.searching = false))
          )
        )
      )
      .subscribe((items) => (this.tutorItems = items));
  }

  public doughnutChartLabels: string[] = [
    'Download Sales',
    'In-Store Sales',
    'Mail-Order Sales',
  ];
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: this.doughnutChartLabels,
    datasets: [
      { data: [350, 450, 100] },
      { data: [50, 150, 120] },
      { data: [250, 130, 70] },
    ],
  };

  dataPending: ChartData = {
    labels: ['Red', 'Blue', 'Yellow'],
    datasets: [
      {
        label: 'My First Dataset',
        data: [300, 50, 100],
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)',
        ],
        hoverOffset: 4,
      },
    ],
  };

  dataApproved: ChartData = {
    labels: ['Red', 'Blue', 'Yellow'],
    datasets: [
      {
        label: 'My First Dataset',
        data: [300, 50, 100],
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)',
        ],
        hoverOffset: 4,
      },
    ],
  };

  chartOptionsNoLegend = {
    plugins: {
      legend: {
        display: false
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  query() {
    const paramsTutor = Object.assign(this.searchTutor);
    this.tutorService.search(paramsTutor).subscribe((resp) => {
      this.tutor = resp.data.items;
    });

    this.loading = true;
    const params = {
      page: this.page,
      take: this.take,
      sort: `${this.sortOption.sortBy}`,
      sortType: `${this.sortOption.sortType}`,
      ...this.searchFields,
    };

    params['startDate'] = new Date(
      this.dateFilter?.startDate || 0
    ).toISOString();
    params['toDate'] = new Date(
      this.dateFilter?.endDate || Date.now()
    ).toISOString();

    if (this.tutorId) params.tutorId = this.tutorId;
    this.payoutService.search(params).subscribe({
      next: (resp) => {
        this.items = resp.data.items;
        this.total = resp.data.count;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toasty.toastError({
          title: 'Error',
          message: 'Something went wrong, please try again!',
        });
      },
    });
  }

  queryStats() {
    const params: any = {};
    if (this.dateFilter?.startDate && this.dateFilter?.endDate) {
      params.startDate = new Date(this.dateFilter.startDate).toUTCString();
      params.toDate = new Date(this.dateFilter.endDate).toUTCString();
    }
    if (this.tutorId) {
      params.tutorId = this.tutorId._id;
    }

    this.payoutService.stats(params).subscribe((resp: any) => {
      this.stats = resp.data;
      const { pending, approved } = this.stats;

      if (pending) {
        this.dataPending = {
          labels: ['Total', 'Commission', 'Tutor Balance'],
          datasets: [
            {
              label: 'My First Dataset',
              data: [
                +pending.total.toFixed(2),
                +pending.commission.toFixed(2),
                +pending.balance.toFixed(2),
              ],
              backgroundColor: [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 205, 86)',
              ],
              hoverOffset: 4,
            },
          ],
        };
      }

      if (approved) {
        this.dataApproved = {
          labels: ['Total', 'Commission', 'Tutor Balance'],
          datasets: [
            {
              label: 'My First Dataset',
              data: [
                +approved.total.toFixed(2),
                +approved.commission.toFixed(2),
                +approved.balance.toFixed(2),
              ],
              backgroundColor: [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 205, 86)',
              ],
              hoverOffset: 4,
            },
          ],
        };
      }
    });
  }

  sortBy(field: string, type: string) {
    this.sortOption.sortBy = field;
    this.sortOption.sortType = type;
    this.query();
  }

  onSort(sortOption: ISortOption) {
    this.sortOption = sortOption;
    this.query();
  }

  export(event: any) {
    const params = Object.assign(
      {
        page: this.page,
        take: this.take,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
      },
      this.searchFields
    );
    if (this.tutorId) {
      params.tutorId = this.tutorId._id;
    }
    if (event.target.value) {
      this.payoutService.export(event.target.value, params);
    }
  }

  public datePickerOptions: IDatePickerOptions = {
    singleDatePicker: false,
    onSelectedDate: this.onSelectedDate.bind(this),
    autoApply: false,
    closeOnApply: true,
  };

  onSelectedDate(event: { startDate: Dayjs; endDate: Dayjs }) {
    if (!event) {
      return this.toasty.toastError({
        title: 'Error',
        message: 'Something went wrong, please try again.',
      });
    }
    this.dateFilter = event;
  }
}
