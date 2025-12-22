import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { ICourse, ISubject, ITopic } from 'src/app/interface';
import { ageFilter } from 'src/app/lib';
import {
  AppService,
  CourseService,
  GradeService,
  STATE,
  SeoService,
  StateService,
  SubjectService,
  TopicService
} from 'src/app/services';
import * as jQuery from 'jquery';
@Component({
  selector: 'app-course-listing',
  templateUrl: './list.html'
})
export class CourseListComponent implements OnInit {
  public page = 1;
  public totalCourses = 0;
  public items: ICourse[] = [];
  public item1: ICourse;
  public currentPage = 1;
  public pageSize = 12;
  public showMoreFilter = false;
  public searchFields: any = {
    categoryIds: '',
    gradeIds: '',
    subjectIds: '',
    topicIds: ''
  };
  public sortOption = { sortBy: '', sortType: '' };

  public queryParams: any;
  public timeout: any;
  public loading = false;
  public categories: any = [];
  public itemChunks: ICourse[][] = [];
  public dateChange: any = {};
  public config: any;
  public grades: any[] = [];
  public total: any = 0;
  public subjects: ISubject[] = [];
  public topics: ITopic[] = [];
  public ageFilter: any[] = ageFilter;
  constructor(
    private courseService: CourseService,
    private route: ActivatedRoute,
    private seoService: SeoService,
    private router: Router,
    private gradeService: GradeService,
    private subjectService: SubjectService,
    private topicService: TopicService,
    public stateService: StateService,
    private appService: AppService
  ) {
    this.seoService.setMetaTitle('List Courses');
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
    this.config = this.stateService.getState(STATE.CONFIG);
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
  showMore() {
    this.showMoreFilter = !this.showMoreFilter;
  }
  query() {
    this.loading = true;
    this.courseService
      .search({
        page: this.currentPage,
        take: this.pageSize,
        isOpen: true,
        approved: true,
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
        this.totalCourses = resp.data.count;
        this.items = resp.data.items;
        this.itemChunks = _.chunk(this.items, 6);
        this.item1 =
          this.itemChunks.length && this.itemChunks[0].length
            ? this.itemChunks[0][0]
            : (null as any);
        this.loading = false;
        jQuery(document).ready(function () {
          const showChar = 150; // How many characters are shown by default
          const ellipsestext = '...';
          // const moretext = 'Read More...';
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
      })
      .catch((e: any) => {
        this.loading = false;
        this.appService.toastError(e);
      });
  }
  sortBy(field: string, type: string) {
    this.sortOption = {
      sortBy: field,
      sortType: type
    };

    this.query();
  }

  sortPrice(evt: any) {
    const value = evt.target.value;
    if (value) {
      this.sortOption = {
        sortBy: 'price',
        sortType: value
      };
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

  getCategories(course: ICourse): string {
    let categories = '';
    if (course.categories.length > 0) {
      course.categories.forEach((cat) => {
        categories = categories + cat.name + ', ';
      });
      categories = categories.slice(0, -2);
    }
    return categories;
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

  pageChange() {
    $('html, body').animate({ scrollTop: 0 });
    this.router.navigate(['/courses'], {
      queryParams: { page: this.currentPage },
      queryParamsHandling: 'merge'
    });
  }
}
