import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppPaginationComponent } from '@components/common';
import { SortComponent } from '@components/common/sort/sort.component';
import {
  BadgeComponent,
  BorderDirective,
  CardBodyComponent,
  CardComponent,
  CardFooterComponent,
  CardHeaderComponent,
  ColComponent,
  ContainerComponent,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { cilPencil } from '@coreui/icons';
import { IconModule } from '@coreui/icons-angular';
import { AuthService } from '@services/auth.service';
import { RequestRefundService } from '@services/request-refund.service';
import { UtilService } from '@services/util.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ISortOption } from 'src/interfaces';

@Component({
  selector: 'app-list-request',
  standalone: true,
  templateUrl: './list-request.component.html',
  imports: [
    CommonModule,
    ContainerComponent,
    ColComponent,
    RowComponent,
    TableDirective,
    BorderDirective,
    RouterLink,
    IconModule,
    BadgeComponent,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    AppPaginationComponent,
    CardFooterComponent,
    SortComponent,
  ],
})
export class ListRequestComponent {
  items: any[] = [];
  page = 1;
  take = 10;
  total = 0;
  userId: any;
  dateChange: any = {};
  searchFields: any = {};
  sortOption: ISortOption = {
    sortBy: 'createdAt',
    sortType: 'desc',
  };
  stats: any;
  config: any;
  loading = false;
  currentPage: number = 1;
  pageSize: number = 10;
  icons = { cilPencil };

  private destroy$ = new Subject<void>();

  private refundService = inject(RequestRefundService);
  private toasty = inject(UtilService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.config = this.route.snapshot.data['appConfig'];
    this.route.queryParams.subscribe((params) => {
      const page = params['page'] ? parseInt(params['page']) : 1;
      this.currentPage = !isNaN(page) ? page : 1;
    });
    this.authService
      .getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: any) => {
          this.userId = user?._id;
          this.query();
        },
        error: () => {
          this.toasty.toastError({
            message: 'Failed to load user info.',
          });
        },
      });
  }

  query(): void {
    this.loading = true;

    const params = {
      page: this.page,
      take: this.take,
      sort: this.sortOption.sortBy,
      sortType: this.sortOption.sortType,
      ...this.searchFields,
    };

    this.refundService
      .search(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          this.items = resp.data.items;
          this.total = resp.data.count;
          this.loading = false;
        },
        error: () => {
          this.toasty.toastError({
            message: 'An error has occurred. Try Again!',
          });
          this.loading = false;
        },
      });
  }

  sortBy(field: string, type: string): void {
    this.sortOption = { sortBy: field, sortType: type };
    this.query();
  }

  onSort(sortOption: ISortOption): void {
    this.sortOption = sortOption;
    this.query();
  }

  dateChangeEvent(dateChange: any): void {
    if (!dateChange) {
      this.toasty.toastError({
        message: 'An error has occurred. Try Again!',
      });
      return;
    }
    this.dateChange = dateChange;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
