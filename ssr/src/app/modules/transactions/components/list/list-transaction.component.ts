import { Component, OnInit } from '@angular/core';
import {
  AppService,
  STATE,
  SeoService,
  StateService,
  TransactionService
} from 'src/app/services';
import { ITransaction, IUser } from 'src/app/interface';
declare let $: any;
@Component({
  selector: 'app-list-transactions',
  templateUrl: './list.html'
})
export class ListTransactionComponent implements OnInit {
  public userId: any;
  public status: any;
  public page = 1;
  public pageSize = 10;
  public total: any = 8;
  public searchFields: any = {
    targetType: '',
    status: ''
  };
  public transaction: ITransaction[] = [];
  public loading = false;
  public type: any;
  public sortOption = {
    sortBy: 'createdAt',
    sortType: 'desc'
  };
  public columns = [
    {
      title: 'Tutor name',
      dataIndex: 'tutor',
      sorter: true,
      sortBy: 'tutorId'
    },
    {
      title: 'Type',
      dataIndex: 'type',
      sorter: true,
      sortBy: 'type'
    },
    {
      title: 'Code',
      dataIndex: 'code',
      sorter: true,
      sortBy: 'code'
    }
  ];
  public config: any;
  public currentUser: IUser;
  constructor(
    private appService: AppService,
    private seoService: SeoService,
    private transactionService: TransactionService,
    public stateService: StateService
  ) {
    this.seoService.setMetaTitle('My Transactions');
    this.loading = true;
    this.config = this.stateService.getState(STATE.CONFIG);
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
  }

  ngOnInit() {
    this.userId = this.currentUser._id;
    this.type = this.currentUser.type;
    this.query();
  }

  query() {
    this.loading = true;
    this.transactionService
      .search({
        userId: this.userId,
        page: this.page,
        take: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
        ...this.searchFields
      })
      .then((resp) => {
        this.transaction = resp.data.items;
        this.total = resp.data.count;
        this.loading = false;
      })
      .catch((err) => {
        this.loading = false;
        return this.appService.toastError(err);
      });
  }

  pageChange() {
    $('html, body').animate({ scrollTop: 0 });
    this.query();
  }

  sortBy(field: string, type: string) {
    this.sortOption.sortBy = field;
    this.sortOption.sortType = type;

    this.query();
  }

  onSort(evt: any) {
    this.sortOption = evt;
    this.query();
  }
}
