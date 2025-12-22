import { Component, OnInit } from '@angular/core';
import { IRefund } from 'src/app/interface/refund';
import {
  AppService,
  AuthService,
  RequestRefundService,
  STATE,
  SeoService,
  StateService
} from 'src/app/services';
declare let $: any;

@Component({
  selector: 'app-request-refund-listing',
  templateUrl: './listing.html'
})
export class ListingRequestComponent implements OnInit {
  public items: IRefund[] = [];
  public page = 1;
  public take = 10;
  public total = 0;
  public userId: any;
  public dateChange: any = {};
  public searchFields: any = {};
  public timeout: any;
  public sortOption = {
    sortBy: 'createdAt',
    sortType: 'desc'
  };
  public stats: any;
  public loading: Boolean = true;
  public config: any;
  constructor(
    private refundService: RequestRefundService,
    private appService: AppService,
    private seoService: SeoService,
    private authService: AuthService,
    public stateService: StateService
  ) {
    this.seoService.setMetaTitle('Refund Request Manager');
    this.config = this.stateService.getState(STATE.CONFIG);
  }

  ngOnInit() {
    this.authService.getCurrentUser().then((resp) => {
      this.userId = resp.id;
      this.query();
    });
  }

  query() {
    this.loading = true;
    this.refundService
      .search({
        page: this.page,
        take: this.take,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
        userId: this.userId,
        ...this.searchFields
      })
      .then((resp) => {
        this.items = resp.data.items;
        this.total = resp.data.count;
        this.loading = false;
      })
      .catch(() => {
        this.appService.toastError();
        this.loading = false;
      });
  }

  sortBy(field: string, type: string) {
    this.sortOption.sortBy = field;
    this.sortOption.sortType = type;
    this.query();
  }

  dateChangeEvent(dateChange: any) {
    if (!dateChange) {
      this.appService.toastError();
    }
    this.dateChange = dateChange;
  }

  onSort(evt: any) {
    this.sortOption = evt;
    this.query();
  }

  doSearch(evt: any) {
    const searchText = evt.target.value; // this is the search text
    if (this.timeout) {
      window.clearTimeout(this.timeout);
    }
    this.timeout = window.setTimeout(() => {
      this.searchFields.name = searchText;
      this.query();
    }, 400);
  }

  pageChange() {
    $('html, body').animate({ scrollTop: 0 });
    this.query();
  }
}
