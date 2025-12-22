import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { ICategory, ICourse, IUser, IWebinar } from '../../interface';
import {
  AppService,
  CourseService,
  SeoService,
  TutorService,
  WebinarService
} from 'src/app/services';
declare var $: any;

@Component({
  templateUrl: './category.component.html'
})
export class CategoriesComponent implements OnInit {
  public webinars: IWebinar[] = [];
  public courses: ICourse[] = [];
  public webinarPagination: any = {
    total: 0,
    page: 0,
    pageSize: 6
  };
  public coursePagination: any = {
    total: 0,
    page: 0,
    pageSize: 6
  };
  public showWebinarList: boolean = true;
  public showCourseList: boolean = true;

  public categories: ICategory[] = [];
  public searchedCategories: ICategory[] = [];
  public selectedCategoryIds: string[] = [];
  public tutors: IUser[] = [];

  constructor(
    private webinarsService: WebinarService,
    private route: ActivatedRoute,
    private appService: AppService,
    private tutorService: TutorService,
    private seoService: SeoService,
    private courseService: CourseService
  ) {
    this.seoService.setMetaTitle('Categories');
    this.route.queryParams.subscribe((params) => {
      if (params.categoryIds && params.categoryIds.length) {
        params.categoryIds.split(',').forEach((id: string) => {
          this.selectedCategoryIds.push(id);
        });
      }
      this.queryWebinars();
      this.queryCourses();
    });
  }
  ngOnInit() {
    const cate_data = this.route.snapshot.data['categories'];
    if (cate_data) {
      this.categories = this.searchedCategories = cate_data;
    }
    this.queryTutors();
  }

  queryCourses() {
    this.courseService
      .search({
        page: this.coursePagination.page,
        take: this.coursePagination.pageSize,
        sort: 'createdAt',
        sortType: 'desc',
        disabled: false,
        categoryIds: this.selectedCategoryIds.join(',')
      })
      .then((resp) => {
        this.coursePagination.total = resp.data.count;
        this.courses = resp.data.items;
      })
      .catch((e) => {
        this.appService.toastError(e);
      });
  }
  queryWebinars() {
    this.webinarsService
      .search({
        page: this.webinarPagination.page,
        take: this.webinarPagination.pageSize,
        sort: 'createdAt',
        sortType: 'desc',
        isOpen: true,
        disabled: false,
        categoryIds: this.selectedCategoryIds.join(',')
      })
      .then((resp) => {
        this.webinarPagination.total = resp.data.count;
        this.webinars = resp.data.items;
      })
      .catch((e) => {
        this.appService.toastError(e);
      });
  }

  queryTutors() {
    this.tutorService
      .search({
        page: 0,
        take: 10,
        sort: 'createdAt',
        sortType: 'asc',
        isHomePage: true
      })
      .then((resp) => {
        this.tutors = resp.data.items;
      })
      .catch(() => this.appService.toastError());
  }

  onChangeCategorySelect(id: string) {
    if (this.selectedCategoryIds.includes(id)) {
      this.selectedCategoryIds = this.selectedCategoryIds.filter(
        (item: string) => item !== id
      );
    } else this.selectedCategoryIds.push(id);

    this.webinarPagination.page = 0;
    this.coursePagination.page = 0;

    this.queryWebinars();
    this.queryCourses();
  }

  handleOnSearchCategory(event: any) {
    const debounceSearch = _.debounce((event) => {
      this.searchedCategories = this.categories.filter((item) =>
        item.name.toLowerCase().includes(event.target.value.toLowerCase())
      );
    }, 500);

    debounceSearch(event);
  }

  pageChange(type: 'webinar' | 'course') {
    if (type === 'webinar') {
      $('html, body').animate(
        {
          scrollTop: $('#webinar-list').offset().top
        },
        800
      );
      this.queryWebinars();
    } else {
      this.queryCourses();
      $('html, body').animate(
        {
          scrollTop: $('#course-list').offset().top
        },
        800
      );
    }
  }
}
