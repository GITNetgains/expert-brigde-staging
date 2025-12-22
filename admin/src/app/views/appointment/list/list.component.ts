  import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import {
  BadgeComponent,
  BorderDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardFooterComponent,
  CardHeaderComponent,
  ColComponent,
  ContainerComponent,
  FormSelectDirective,
  GutterDirective,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { DatePickerCustomComponent } from '@components/common/date-picker-custom/date-picker-custom.component';
import { EyeIconComponent } from '@components/common/icons/eye-icon/eye-icon.component';
import { SortComponent } from '@components/common/sort/sort.component';
import { AppPaginationComponent } from '@components/index';
import { NgSelectModule } from '@ng-select/ng-select';
import { AppointmentService } from '@services/appointment.service';
import { TutorService } from '@services/tutor.service';
import { UserService } from '@services/user.service';
import { UtilService } from '@services/util.service';
import { Dayjs } from 'dayjs';
import { IDatePickerOptions, ISortOption } from 'src/interfaces';

@Component({
  selector: 'app-appointment-listing',
  templateUrl: './list.component.html',
  standalone: true,
  imports: [
    FormsModule,
    ContainerComponent,
    RowComponent,
    ColComponent,
    ButtonDirective,
    CommonModule,
    RouterModule,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    GutterDirective,
    TableDirective,
    BorderDirective,
    BadgeComponent,
    RouterLink,
    AppPaginationComponent,
    CardFooterComponent,
    SortComponent,
    NgSelectModule,
    FormSelectDirective,
    EyeIconComponent,
    DatePickerCustomComponent,
  ],
})
export class AppointmentListingComponent implements OnInit {
  count: number = 0;
  items: any[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  searchFields: any = { status: '' };
  nameTutor: string = '';
  sortOption: ISortOption = {
    sortBy: 'createdAt',
    sortType: 'desc',
  };
  tutorId: any;
  userId: any;
  dateChange: any;
  status: string = '';
  searching = false;
  tutorInput$ = new Subject<string>();
  userInput$ = new Subject<string>();
  tutorItems: any[] = [];
  userItems: any[] = [];
  searchTutor: any = { take: 1000 };
  searchUser: any = { take: 1000 };
  tutor: any = [];
  user: any = [];

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private appointmentService = inject(AppointmentService);
  private tutorService = inject(TutorService);
  private userService = inject(UserService);
  private toasty = inject(UtilService);

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const page = parseInt(params['page']) || 1;
      this.currentPage = !isNaN(page) ? page : 1;
      this.query();
    });
    this.initSearchStreams();
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

    this.userInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.searching = true)),
        switchMap((term) =>
          this.userService.search({ name: term }).pipe(
            map((resp: any) => resp.data.items),
            catchError(() => of([])),
            tap(() => (this.searching = false))
          )
        )
      )
      .subscribe((items) => (this.userItems = items));
  }

  query() {
    const paramsTutor = Object.assign(this.searchTutor);
    this.tutorService.search(paramsTutor).subscribe((resp) => {
      this.tutor = resp.data.items;
    });

    const paramsUser = Object.assign(this.searchUser);
    this.userService.search(paramsUser).subscribe((resp) => {
      this.user = resp.data.items;
    });

    const params: any = {
      page: this.currentPage,
      take: this.pageSize,
      sort: this.sortOption.sortBy,
      sortType: this.sortOption.sortType,
      ...this.searchFields,
    };

    if (this.status) params.status = this.status;
    if (this.tutorId) params.tutorId = this.tutorId;
    if (this.userId) params.userId = this.userId;

    params.startTime = new Date(this.dateChange?.startDate || 0).toISOString();
    params.toTime = new Date(
      this.dateChange?.endDate || Date.now()
    ).toISOString();

    this.appointmentService.search(params).subscribe({
      next: (resp) => {
        this.count = resp.data.count;
        this.items = resp.data.items;
      },
      error: () => {
        this.toasty.toastError({
          title: 'Error',
          message: 'Something went wrong, please try again!',
        });
      },
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

  onPageChange(event: any) {
    const page =
      typeof event === 'number'
        ? event
        : parseInt(event.target.value || event.target.innerText, 10);
    this.currentPage = page;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: this.currentPage },
      queryParamsHandling: 'merge',
    });
  }

  filter() {
    this.currentPage = 1;
    // Always call query() directly first to ensure filtering works immediately
    this.query();
    // Update URL to reflect page 1 for consistency and browser history
    // Use replaceUrl to avoid adding unnecessary history entries
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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
    this.dateChange = event;
  }
}
