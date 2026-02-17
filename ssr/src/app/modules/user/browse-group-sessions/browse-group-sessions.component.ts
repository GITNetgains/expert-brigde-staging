import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ICategory, ISubject, IWebinar } from 'src/app/interface';
import {
  AppService,
  AppointmentService,
  AuthService,
  SeoService,
  StateService,
  SubjectService,
  WebinarService
} from 'src/app/services';
import categoriesResolver from 'src/app/services/resolvers/category.resolver';

@Component({
  selector: 'app-browse-group-sessions',
  templateUrl: './browse-group-sessions.html'
})
export class BrowseGroupSessionsComponent implements OnInit {
  public currentPage = 1;
  public pageSize = 12;
  public totalWebinars = 0;
  public items: IWebinar[] = [];
  public showMoreFilter = false;
  public searchFields: any = {
    categoryIds: '',
    subjectIds: ''
  };
  public loading = false;
  public loadingTutors = false;
  public categories: ICategory[] = [];
  public subjects: ISubject[] = [];
  public assignedTutorIds: string[] = [];
  public timeout: any;

  constructor(
    private webinarService: WebinarService,
    private appointmentService: AppointmentService,
    private appService: AppService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private seoService: SeoService,
    private subjectService: SubjectService,
    public stateService: StateService
  ) {
    this.seoService.setMetaTitle('Browse group sessions of the experts');
    this.categories = this.route.snapshot.data['categories'] || [];
    this.route.queryParams.subscribe((params: any) => {
      this.currentPage = params.page ? parseInt(params.page, 10) : 1;
      if (params?.categoryIds) {
        this.searchFields = { ...this.searchFields, categoryIds: params.categoryIds };
      }
      if (params?.subjectIds) {
        this.searchFields = { ...this.searchFields, subjectIds: params.subjectIds };
      }
      this.query();
    });
  }

  ngOnInit() {
    if (!this.authService.isLoggedin()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.loadAssignedTutorIds();
  }

  loadAssignedTutorIds() {
    this.loadingTutors = true;
    this.appointmentService
      .search({
        take: 500,
        sort: 'createdAt',
        sortType: 'desc',
        targetType: 'webinar'
      })
      .then((resp) => {
        const items = resp?.data?.items || [];
        const ids = new Set<string>();
        items.forEach((a: any) => {
          if (a.tutorId && a.tutorId._id) ids.add(a.tutorId._id);
          else if (a.tutorId) ids.add(String(a.tutorId));
        });
        this.assignedTutorIds = Array.from(ids);
        this.loadingTutors = false;
        this.query();
      })
      .catch(() => {
        this.loadingTutors = false;
        this.assignedTutorIds = [];
        this.query();
      });
  }

  query() {
    if (this.loadingTutors) return;
    if (this.assignedTutorIds.length === 0) {
      this.items = [];
      this.totalWebinars = 0;
      this.loading = false;
      return;
    }
    this.loading = true;
    const params: any = {
      page: this.currentPage,
      take: this.pageSize,
      isOpen: true,
      disabled: false,
      sort: 'createdAt',
      sortType: 'desc',
      ...this.searchFields
    };
    if (this.assignedTutorIds.length) {
      params.tutorIds = this.assignedTutorIds.join(',');
    }
    this.webinarService
      .search(params)
      .then((resp) => {
        this.totalWebinars = resp.data.count;
        this.items = resp.data.items;
        this.loading = false;
      })
      .catch((e) => {
        this.loading = false;
        this.appService.toastError(e);
      });
  }

  selectCategory() {
    if (this.searchFields.categoryIds) {
      this.subjectService
        .search({
          categoryIds: this.searchFields.categoryIds,
          take: 1000,
          isActive: true
        })
        .then((resp) => {
          this.subjects = resp.data?.items || [];
        });
      this.searchFields.subjectIds = '';
    } else {
      this.searchFields.subjectIds = '';
      this.subjects = [];
    }
    this.currentPage = 1;
    this.router.navigate([], {
      queryParams: { page: 1, categoryIds: this.searchFields.categoryIds || null, subjectIds: null },
      queryParamsHandling: 'merge'
    });
    this.query();
  }

  selectSubject() {
    this.currentPage = 1;
    this.router.navigate([], {
      queryParams: { page: 1, subjectIds: this.searchFields.subjectIds || null },
      queryParamsHandling: 'merge'
    });
    this.query();
  }

  doSearch(evt: any) {
    const searchText = evt.target.value;
    if (this.timeout) window.clearTimeout(this.timeout);
    this.timeout = window.setTimeout(() => {
      this.searchFields.name = searchText;
      this.currentPage = 1;
      this.router.navigate([], { queryParams: { page: 1 }, queryParamsHandling: 'merge' });
      this.query();
    }, 400);
  }

  pageChange() {
    this.router.navigate([], {
      queryParams: { page: this.currentPage },
      queryParamsHandling: 'merge'
    });
    this.query();
  }
}
