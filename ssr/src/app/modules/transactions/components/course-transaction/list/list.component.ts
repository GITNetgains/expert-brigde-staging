import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ITransaction } from 'src/app/interface';
import {
  CourseService,
  AuthService,
  SeoService,
  StateService,
  STATE,
  AppService
} from 'src/app/services';
declare let $: any;
@Component({
  templateUrl: './list.html'
})
export class CourseTransactionListComponent implements OnInit {
  public transactions: ITransaction[] = [];
  public tutorId: string;
  public page = 1;
  public pageSize = 10;
  public total = 0;
  public config: any;
  public sortOption = {
    sortBy: 'createdAt',
    sortType: 'desc'
  };
  public categories: any = [];
  public timeout: any;
  public searchFields: any = {
    categoryIds: '',
    name: ''
  };
  public loading = false;
  constructor(
    private courseService: CourseService,
    private auth: AuthService,
    private appService: AppService,
    private seoService: SeoService,
    public route: ActivatedRoute,
    public stateService: StateService
  ) {
    this.seoService.setMetaTitle('Course Transactions');
    this.config = this.stateService.getState(STATE.CONFIG);
  }
  ngOnInit() {
    this.categories = this.route.snapshot.data['categories'];
    this.auth.getCurrentUser().then((resp) => {
      this.tutorId = resp._id;
      this.query();
    });
  }

  query() {
    this.loading = true;
    this.courseService
      .getTransactions(this.tutorId, {
        userId: this.tutorId,
        page: this.page,
        take: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`
      })
      .then((resp) => {
        this.transactions = resp.data.items;
        const data = this.transactions.slice();
        if (this.searchFields.categoryIds) {
          this.transactions.length = 0;
          data.forEach((item: any) => {
            if (
              item.course.categoryIds &&
              item.course.categoryIds.includes(this.searchFields.categoryIds)
            ) {
              this.transactions.push(item);
            }
          });

          if (this.searchFields.name) {
            //this.transactions.length = 0;
            data.forEach((item: any) => {
              if (
                item.course.name &&
                !item.course.name
                  .toLowerCase()
                  .includes(this.searchFields.name.toLowerCase())
              ) {
                this.transactions.splice(this.transactions.indexOf(item), 1);
              }
            });
          }
        } else {
          if (this.searchFields.name) {
            this.transactions.length = 0;
            data.forEach((item: any) => {
              if (
                item.course.name &&
                item.course.name
                  .toLowerCase()
                  .includes(this.searchFields.name.toLowerCase())
              ) {
                this.transactions.push(item);
              }
            });
          }
        }
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
}
