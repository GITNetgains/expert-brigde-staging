import { Component, OnInit } from '@angular/core';
import { ICoupon } from 'src/app/interface';
import {
  AppService,
  CouponService,
  STATE,
  SeoService,
  StateService
} from 'src/app/services';
@Component({
  selector: 'app-coupon-list',
  templateUrl: './list.html'
})
export class CouponListComponent implements OnInit {
  public items: ICoupon[] = [];
  searchFields = {} as any;
  public count = 0;
  public currentPage = 1;
  public pageSize = 10;
  public sortOption = {
    sortBy: 'createdAt',
    sortType: 'desc'
  };
  loading = false;
  timeout: any;
  public fromItem = 0;
  public toItem = 0;
  constructor(
    private couponService: CouponService,
    private stateService: StateService,
    private appService: AppService,
    private seo: SeoService
  ) {
    this.seo.setMetaTitle('Coupons manager');
  }

  ngOnInit() {
    const currentUser = this.stateService.getState(STATE.CURRENT_USER);
    if (currentUser) {
      this.query();
    }
  }

  query() {
    this.loading = true;
    this.couponService
      .search({
        page: this.currentPage,
        take: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
        ...this.searchFields
      })
      .then((resp) => {
        this.count = resp.data.count;
        this.items = resp.data.items;
        if (this.currentPage === 1) {
          this.fromItem = this.currentPage;
          this.toItem = this.items.length;
        } else if (this.currentPage > 1) {
          this.fromItem =
            this.currentPage * this.pageSize > this.count
              ? (this.currentPage - 1) * this.pageSize
              : this.currentPage * this.pageSize;
          this.toItem = this.fromItem + this.items.length;
        }
        this.loading = false;
      })
      .catch((e) => {
        this.appService.toastError();
      });
  }

  sortBy(field: string, type: string) {
    this.sortOption.sortBy = field;
    this.sortOption.sortType = type;
    this.query();
  }

  onSort(sortOption: any) {
    this.sortOption = sortOption;
    this.query();
  }

  remove(item: any, index: number) {
    if (window.confirm('Are you sure to delete this coupon?')) {
      this.couponService
        .delete(item._id)
        .then(() => {
          this.appService.toastSuccess('Item has been deleted!');
          this.items.splice(index, 1);
          this.count--;
        })
        .catch(() => this.appService.toastError());
    }
  }

  doSearch(evt: any) {
    const searchText = evt.target.value; // this is the search text
    if (this.timeout) {
      window.clearTimeout(this.timeout);
    }
    this.timeout = window.setTimeout(() => {
      this.searchFields.name = searchText;
      this.query();
    }, 200);
  }
}
