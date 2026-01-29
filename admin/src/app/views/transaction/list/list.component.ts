import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  FormControlDirective,
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

import { SortComponent } from '@components/common/sort/sort.component';
import { AppPaginationComponent } from '@components/index';
import { NgSelectModule } from '@ng-select/ng-select';
import { TransactionService } from '@services/transaction.service';
import { TutorService } from '@services/tutor.service';
import { UserService } from '@services/user.service';
import { UtilService } from '@services/util.service';
import { ISortOption } from 'src/interfaces';
import { EyeIconComponent } from '@components/common/icons/eye-icon/eye-icon.component';


@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.component.html',
  imports: [
    CommonModule,
    ContainerComponent,
    ColComponent,
    RowComponent,
    FormControlDirective,
    ButtonDirective,
    ReactiveFormsModule,
    GutterDirective,
    TableDirective,
    BorderDirective,
    RouterLink,
    BadgeComponent,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    GutterDirective,
    AppPaginationComponent,
    CardFooterComponent,
    SortComponent,
    FormsModule,
    FormSelectDirective,
    NgSelectModule,
    EyeIconComponent,
  ],
})
export class ListComponent implements OnInit {
  count: number = 0;
  transaction: any[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  searchFields: any = { targetType: '', status: '' };
  dateChange: any;
  status: any;
  tutorId: any;
  userId: any;
  searching = false;
  service: any;
  sortOption: ISortOption = {
    sortBy: 'createdAt',
    sortType: 'desc',
  };
  config: any;
  loading = false;
  tutorItems: any[] = [];
  userItems: any[] = [];
  tutorInput$ = new Subject<string>();
  userInput$ = new Subject<string>();
  searchTutor: any = { take: 10 };
  searchUser: any = { take: 10 };
  tutor: any = [];
  user: any = [];

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toasty = inject(UtilService);
  private userService = inject(UserService);
  private tutorService = inject(TutorService);
  private transactionService = inject(TransactionService);

  ngOnInit(): void {
    this.config = this.route.snapshot.data['appConfig'];
    this.route.queryParams.subscribe((params) => {
      const page = params['page'] ? parseInt(params['page']) : 1;
      this.currentPage = !isNaN(page) ? page : 1;
      this.query();
    });
    this.initSearchStreams();
  }

  initSearchStreams(): void {
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

  query(): void {
    const paramsTutor = Object.assign(this.searchTutor);
    this.tutorService.search(paramsTutor).subscribe((resp) => {
      this.tutor = resp.data.items;
    });

    const paramsUser = Object.assign(this.searchUser);
    this.userService.search(paramsUser).subscribe((resp) => {
      this.user = resp.data.items;
    });

    this.loading = true;
    const params: any = {
      page: this.currentPage,
      take: this.pageSize,
      sort: this.sortOption.sortBy,
      sortType: this.sortOption.sortType,
      ...this.searchFields,
    };

    if (this.status) {
      params.status = this.status;
    }

    if (this.tutorId) params.tutorId = this.tutorId;
    if (this.userId) params.userId = this.userId;

    if (this.dateChange) {
      params.startTime = new Date(this.dateChange.from).toISOString();
      params.toTime = new Date(this.dateChange.to).toISOString();
    }

    this.transactionService.search(params).subscribe({
      next: (resp) => {
        this.count = resp.data.count;
        this.transaction = resp.data.items;
        this.loading = false;
      },
      error: () => {
        this.toasty.toastError({
          title: 'Error',
          message: 'Something went wrong, please try again!',
        });
        this.loading = false;
      },
    });
  }

  keyPress(event: any): void {
    if (event.charCode === 13) {
      this.query();
    }
  }

  sortBy(field: string, type: string): void {
    this.sortOption.sortBy = field;
    this.sortOption.sortType = type;
    this.query();
  }

  onSort(sortOption: ISortOption): void {
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
      replaceUrl: true
    });
  }

  dateChangeEvent(dateChange: any): void {
    if (!dateChange) {
      this.toasty.toastError({
        title: 'Error',
        message: 'Something went wrong, please try again!',
      });
    }
    this.dateChange = dateChange;
  }
}
