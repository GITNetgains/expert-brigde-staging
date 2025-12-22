import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { ICategory, ISubject, ITopic, IWebinar } from 'src/app/interface';
import { ageFilter } from 'src/app/lib';
import {
  AppService,
  GradeService,
  STATE,
  SeoService,
  StateService,
  SubjectService,
  TopicService,
  WebinarService
} from 'src/app/services';

import * as jQuery from 'jquery';
@Component({
  selector: 'app-webinar-listing',
  templateUrl: './list.html'
})
export class WebinarListingComponent implements OnInit {
  public page = 1;
  public totalWebinars = 0;
  public items: IWebinar[] = [];
  public currentPage = 1;
  public pageSize = 12;
  public showMoreFilter = false;
  public searchFields: any = {
    categoryIds: '',
    gradeIds: '',
    subjectIds: '',
    topicIds: '',
    age: ''
  };
  public grades: any[] = [];
  public sortOption = {
    sortBy: '',
    sortType: ''
  };
  public queryParams: any;
  public timeout: any;
  public loading = false;
  public categories: ICategory[] = [];
  public dateChange: any = {};
  public config: any;
  public subjects: ISubject[] = [];
  public topics: ITopic[] = [];
  public ageFilter: any[] = ageFilter;

  constructor(
    private webinarService: WebinarService,
    private appService: AppService,
    private route: ActivatedRoute,
    private seoService: SeoService,
    private gradeService: GradeService,
    private subjectService: SubjectService,
    private topicService: TopicService,
    public stateService: StateService,
    private router: Router
  ) {
    this.seoService.setMetaTitle('List Group Classes');
    this.config = this.stateService.getState(STATE.CONFIG);
    this.route.queryParams.subscribe((params: any) => {
      this.currentPage = params.page ? parseInt(params.page, 10) : 1;
      if (params?.categoryIds) {
        this.searchFields = {
          ...this.searchFields,
          categoryIds: params.categoryIds
        };
      }
      this.query();
    });
  }

  ngOnInit() {
    this.categories = this.route.snapshot.data['categories'];
    this.gradeService
      .search({
        take: 100,
        sort: 'ordering',
        sortType: 'asc'
      })
      .then((resp) => {
        this.grades = resp.data.items;
      });
  }

  query() {
    this.loading = true;
    this.webinarService
      .search({
        page: this.currentPage,
        take: this.pageSize,
        isOpen: true,
        disabled: false,
        ...(this.sortOption.sortType && this.sortOption.sortBy
          ? {
              sort: `${this.sortOption.sortBy}`,
              sortType: `${this.sortOption.sortType}`
            }
          : { sort: 'createdAt', sortType: 'desc' }),
        ...this.searchFields,
        ...this.dateChange
      })
      .then((resp) => {
        this.totalWebinars = resp.data.count;
        this.items = resp.data.items;
        this.loading = false;
        (function ($) {
          $(document).ready(function () {
            const showChar = 150; // How many characters are shown by default
            const ellipsestext = '...';
            let content = '';
            $('.more1').each(function (this: any) {
              content = $(this).text();
              if (content.length > showChar) {
                const c = content.substr(0, showChar);
                const html =
                  c +
                  '<span class="moreellipses">' +
                  ellipsestext +
                  '&nbsp;</span>' +
                  '</span>&nbsp;&nbsp;' +
                  '</span>';
                $(this).html(html);
              }
            });
          });
        })(jQuery);
      })
      .catch((e) => {
        this.loading = false;
        this.appService.toastError(e);
      });
  }

  sortBy(field: string, type: string) {
    this.sortOption.sortBy = field;
    this.sortOption.sortType = type;
    this.query();
  }

  sortPrice(evt: any) {
    const value = evt.target.value;
    if (value) {
      this.sortOption.sortBy = 'price';
      this.sortOption.sortType = value;
    }
    this.query();
  }

  doSearch(evt: any) {
    const searchText = evt.target.value; // this is the search text
    if (this.timeout) {
      window.clearTimeout(this.timeout);
    }
    this.timeout = window.setTimeout(() => {
      this.searchFields.name = searchText;
      if (this.currentPage > 1) {
        this.router.navigate([], {
          queryParams: { page: 1 },
          queryParamsHandling: 'merge'
        });
      } else {
        this.query();
      }
    }, 400);
  }

  dateChangeEvent(dateChange: any) {
    if (!dateChange) {
      if (this.dateChange.startTime && this.dateChange.toTime) {
        delete this.dateChange.startTime;
        delete this.dateChange.toTime;
        if (this.currentPage > 1) {
          this.router.navigate([], {
            queryParams: { page: 1 },
            queryParamsHandling: 'merge'
          });
        } else {
          this.query();
        }
      }
    } else {
      this.dateChange = {
        startTime: dateChange.from,
        toTime: dateChange.to
      };
      if (this.currentPage > 1) {
        this.router.navigate([], {
          queryParams: { page: 1 },
          queryParamsHandling: 'merge'
        });
      } else {
        this.query();
      }
    }
  }
  gradeChange() {
    if (this.currentPage > 1) {
      this.router.navigate([], {
        queryParams: { page: 1 },
        queryParamsHandling: 'merge'
      });
    } else {
      this.query();
    }
  }

  pageChange() {
    $('html, body').animate({ scrollTop: 0 });
    this.router.navigate([], {
      queryParams: { page: this.currentPage },
      queryParamsHandling: 'merge'
    });
  }

  selectCategory() {
    if (this.searchFields.categoryIds) {
      this.querySubjects();
      this.searchFields.topicIds = [];
    } else {
      this.searchFields.subjectIds = [];
      this.searchFields.topicIds = [];
      this.subjects = [];
      this.topics = [];
    }
    if (this.currentPage > 1) {
      this.router.navigate([], {
        queryParams: { page: 1 },
        queryParamsHandling: 'merge'
      });
    } else {
      this.query();
    }
  }

  querySubjects() {
    this.subjectService
      .search({
        categoryIds: this.searchFields.categoryIds,
        take: 1000,
        isActive: true
      })
      .then((resp) => {
        if (resp.data && resp.data.items && resp.data.items.length > 0) {
          this.subjects = resp.data.items;
        } else {
          this.subjects = [];
        }
      });
  }

  selectSubject() {
    if (this.searchFields.subjectIds) {
      this.queryTopic();
    } else {
      this.searchFields.topicIds = [];
      this.topics = [];
    }
    if (this.currentPage > 1) {
      this.router.navigate([], {
        queryParams: { page: 1 },
        queryParamsHandling: 'merge'
      });
    } else {
      this.query();
    }
  }

  queryTopic() {
    this.topicService
      .search({
        subjectIds: this.searchFields.subjectIds,
        take: 1000,
        isActive: true
      })
      .then((resp) => {
        if (resp.data && resp.data.items && resp.data.items.length > 0) {
          this.topics = resp.data.items;
        } else {
          this.topics = [];
        }
      });
  }

  filterByAge(event: any) {
    if (event) {
      this.searchFields = { ...this.searchFields, age: JSON.stringify(event) };
    } else this.searchFields.age = '';
    if (this.currentPage > 1) {
      this.router.navigate([], {
        queryParams: { page: 1 },
        queryParamsHandling: 'merge'
      });
    } else {
      this.query();
    }
  }
}
