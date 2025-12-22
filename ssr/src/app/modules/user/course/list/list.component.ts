import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ICourse, IUser } from 'src/app/interface';
import {
  AppService,
  AuthService,
  CourseService,
  STATE,
  SeoService,
  StateService
} from 'src/app/services';

@Component({
  selector: 'app-course-listing',
  templateUrl: './list.html'
})
export class CourseListingComponent implements OnInit {
  public total = 0;
  public items: ICourse[];
  public currentPage = 1;
  public pageSize = 10;
  public categories: any = [];
  public searchFields: any = {
    categoryIds: ''
  };
  public sortOption = {
    sortBy: 'createdAt',
    sortType: 'desc'
  };
  public currentUser: IUser;
  public fromItem = 0;
  public toItem = 0;
  public timeout: any;
  public loading = false;
  public config: any;
  constructor(
    private translate: TranslateService,
    private courseService: CourseService,
    private appService: AppService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private seoService: SeoService,
    public stateService: StateService
  ) {
    this.seoService.setMetaTitle('Courses Manager');
  }

  ngOnInit() {
    this.config = this.stateService.getState(STATE.CONFIG);
    this.categories = this.route.snapshot.data['categories'];
    this.auth.getCurrentUser().then((resp) => {
      this.currentUser = resp;
      if (this.currentUser._id) {
        this.query();
      }
    });
  }

  query() {
    this.loading = true;
    this.courseService
      .search({
        page: this.currentPage,
        take: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
        tutorId: this.currentUser._id,
        ...this.searchFields
      })
      .then((resp) => {
        this.total = resp.data.count;
        this.items = resp.data.items;
        if (this.currentPage === 1) {
          this.fromItem = this.currentPage;
          this.toItem = this.items.length;
        } else if (this.currentPage > 1) {
          this.fromItem =
            this.currentPage * this.pageSize > this.total
              ? (this.currentPage - 1) * this.pageSize
              : this.currentPage * this.pageSize;
          this.toItem = this.fromItem + this.items.length;
        }
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
        this.appService.toastError();
      });
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

  showChange(evt: any) {
    this.pageSize = evt.target.value;
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

  remove(item: any, index: number) {
    if (
      window.confirm(
        this.translate.instant('Are you sure to delete this course?')
      )
    ) {
      this.courseService
        .delete(item._id)
        .then(() => {
          this.appService.toastSuccess('Course has been deleted!');
          this.items.splice(index, 1);
        })
        .catch((e) => this.appService.toastError(e));
    }
  }
}
