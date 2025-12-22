import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ICourse, IMyCourse, IUser } from 'src/app/interface';
import {
  AppService,
  AuthService,
  MyCourseService,
  SeoService
} from 'src/app/services';
@Component({
  templateUrl: './list.html'
})
export class ListMyCourseComponent implements OnInit {
  public currentUser: IUser;
  public currentPage = 1;
  public pageSize = 10;
  public total = 2;
  public categories: any = [];
  public searchFields: any = {
    categoryIds: ''
  };
  public timeout: any;
  public sortOption = {
    sortBy: 'createdAt',
    sortType: 'desc'
  };
  public course: ICourse;
  public courses: IMyCourse[] = [];
  public count: Number = 0;
  public loading = false;

  constructor(
    private auth: AuthService,
    private myCourseService: MyCourseService,
    private route: ActivatedRoute,
    private seoService: SeoService,
    private appService: AppService
  ) {
    this.seoService.setMetaTitle('My Courses');
  }

  ngOnInit() {
    this.categories = this.route.snapshot.data['categories'];
    if (this.auth.isLoggedin()) {
      this.auth.getCurrentUser().then((resp) => {
        this.currentUser = resp;
        this.query();
      });
    }
  }

  query() {
    this.loading = true;
    const params = Object.assign(
      {
        page: this.currentPage,
        take: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
        userId: this.currentUser._id
      },
      this.searchFields
    );
    this.myCourseService
      .search(params)
      .then((resp) => {
        this.count = resp.data.count;
        this.courses = resp.data.items;
        this.total = resp.data.count;
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

  onSort(evt: any) {
    this.sortOption = evt;
    this.query();
  }

  pageChange() {
    $('html, body').animate({ scrollTop: 0 });
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
