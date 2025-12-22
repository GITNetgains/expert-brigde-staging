import { Component, OnInit } from '@angular/core';
import { IPayoutAccount } from '../interface';
import { TranslateService } from '@ngx-translate/core';
import { AccountService, AppService, SeoService } from 'src/app/services';
declare let $: any;
@Component({
  selector: 'app-account-listing',
  templateUrl: './listing.html'
})
export class ListingAccountsComponent implements OnInit {
  public accounts: IPayoutAccount[] = [];
  public page = 1;
  public pageSize = 10;
  public total = 0;
  public timeout: any;
  public searchFields: any = {};
  public searchType: any = '';
  public sortOption: any = {
    sortBy: 'createdAt',
    sortType: 'desc'
  };
  public loading = false;

  constructor(
    private accountService: AccountService,
    private appService: AppService,
    private seoService: SeoService,
    private translate: TranslateService
  ) {
    this.seoService.setMetaTitle('Accounts manager');
  }

  ngOnInit() {
    this.query();
  }

  query() {
    this.loading = true;
    this.accountService
      .find({
        page: this.page,
        take: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
        type: this.searchType
      })
      .then((res) => {
        this.accounts = res.data.items;
        this.total = res.data.count;
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
        this.appService.toastError();
      });
  }

  sortBy(field: string, type: string) {
    this.sortOption.sortBy = field;
    this.sortOption.sortType = type;
    this.query();
  }

  keyPress(event: any) {
    if (event.charCode === 13) {
      this.query();
    }
  }

  remove(itemId: any, index: number) {
    if (
      window.confirm(
        this.translate.instant('Are you sure to delete this item?')
      )
    ) {
      this.accountService
        .remove(itemId)
        .then(() => {
          this.appService.toastSuccess('Item has been deleted!');
          this.accounts.splice(index, 1);
        })
        .catch((err) => this.appService.toastError(err));
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
    }, 400);
  }

  onSort(evt: any) {
    this.sortOption = evt;
    this.query();
  }

  pageChange() {
    $('html, body').animate({ scrollTop: 0 });
    this.query();
  }
}
