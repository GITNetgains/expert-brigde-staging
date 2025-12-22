import { Component, OnInit } from '@angular/core';
import { CouponService } from '@services/coupon.service';
import { UtilService } from '@services/util.service';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SortComponent } from '@components/common/sort/sort.component';
import { ISortOption } from 'src/interfaces';
import {
  ButtonDirective,
  ColComponent,
  FormControlDirective,
  CardComponent,
  CardBodyComponent,
  RowComponent,
  CardHeaderComponent,
  ContainerComponent,
  CardFooterComponent,
  TableDirective,
  BorderDirective,
} from '@coreui/angular';
import { AppPaginationComponent } from '@components/index';

import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconDirective } from '@coreui/icons-angular';
import { freeSet } from '@coreui/icons';

@Component({
  selector: 'app-coupon-list',
  templateUrl: './list.component.html',
  standalone: true,
  imports: [
    DatePipe,
    IconDirective,
    RouterLink,
    ButtonDirective,
    ColComponent,
    FormControlDirective,
    RowComponent,
    CardComponent,
    CardBodyComponent,
    FormsModule,
    CardHeaderComponent,
    CardFooterComponent,
    ContainerComponent,
    AppPaginationComponent,
    SortComponent,
    TableDirective,
    BorderDirective,
  ],
})
export class ListCouponComponent implements OnInit {
  public count: number = 0;
  public items: any[] = [];
  public currentPage: number = 1;
  public pageSize: number = 10;
  public searchField: any = {};
  sortOption: ISortOption = {
    sortBy: 'createdAt',
    sortType: 'desc',
  };
  loading = false;
  icons = freeSet;

  constructor(
    private router: Router,
    private couponService: CouponService,
    private utilService: UtilService,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe((params) => {
      const page = params['page'] ? parseInt(params['page']) : 1;
      this.currentPage = !isNaN(page) ? page : 1;
      this.query();
    });
  }

  ngOnInit(): void {}

  query() {
    this.loading = true;
    const params = Object.assign(
      {
        page: this.currentPage,
        take: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
      },
      this.searchField
    );
    this.couponService.search(params).subscribe(
      (resp) => {
        this.count = resp.data.count;
        this.items = resp.data.items;
        this.loading = false;
      },
      (error) => {
        // console.error('Error fetching grades:', error);
        this.utilService.toastError({
          title: 'Errors',
          message: 'error',
        });
      }
    );
  }

  deleteCoupon(id: string): void {
    if (confirm('Are you sure you want to delete this coupon?')) {
      this.couponService.delete(id).subscribe(
        (response) => {
          this.query();
          this.utilService.toastSuccess({
            title: 'Errors',
            message: 'remove coupon success',
          });
        },
        (error) => {
          this.utilService.toastError({
            title: 'Errors',
            message: 'error',
          });
        }
      );
    }
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
    this.query();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
