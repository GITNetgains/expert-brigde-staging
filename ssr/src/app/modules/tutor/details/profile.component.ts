import {
  Component,
  OnInit,
  AfterViewInit,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ICourse, IStatsReview, IUser, IWebinar } from 'src/app/interface';
import {
  AppService,
  AuthService,
  CourseService,
  FavoriteService,
  LanguageService,
  STATE,
  SeoService,
  StateService,
  WebinarService
} from 'src/app/services';
import { environment } from 'src/environments/environment';
import * as jQuery from 'jquery';
import { isPlatformBrowser } from '@angular/common';
@Component({
  templateUrl: './profile.html'
})
export class TutorProfileComponent implements OnInit, AfterViewInit {
  public tutor: IUser;
  public languages: any;
  public languageNames: any = [];
  public objectLanguage: any = {};
  public gradeNames: any = [];
  public webinars: IWebinar[] = [];
  public courses: ICourse[] = [];
  public currentPage = 1;
  public pageSize = 5;
  public searchFields: any = {};
  public isLoggedin = false;
  public webUrl: string;
  public sortOption = {
    sortBy: 'createdAt',
    sortType: 'desc'
  };
  public count = 0;
  public countCourse = 0;
  public showChar = 500;
  public showMore = false;
  public slideConfig = {
    centerMode: false,
    centerPadding: '60px',
    dots: false,
    infinite: true,
    speed: 2000,
    slidesToShow: 3,
    slidesToScroll: 2,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          centerMode: false,
          dots: false,
          centerPadding: '40px',
          slidesToShow: 2,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 600,
        settings: {
          arrows: false,
          centerMode: false,
          dots: false,
          centerPadding: '40px',
          slidesToShow: 1,
          vertical: false,
          slidesToScroll: 1
        }
      }
    ]
  };

  public config: any;

  public statsReview: IStatsReview = {
    ratingAvg: 0,
    ratingScore: 0,
    totalRating: 0
  };

  public optionsReview: any = {
    rateTo: ''
  };
  public type: any;

  public urlYoutube: any;
  // tslint:disable-next-line:max-line-length
  public moreTag = '';
  public webinarOptions = {
    webinars: [],
    currentPage: 1,
    pageSize: 6,
    sortOption: {
      sortBy: 'createdAt',
      sortType: 'asc'
    },
    count: 0
  } as any;
  public courseOptions = {
    courses: [],
    currentPage: 1,
    pageSize: 6,
    sortOption: {
      sortBy: 'createdAt',
      sortType: 'asc'
    },
    count: 0
  } as any;
  constructor(
    private route: ActivatedRoute,
    private appService: AppService,
    private seoService: SeoService,
    private authService: AuthService,
    private languageService: LanguageService,
    private webinarService: WebinarService,
    private sanitizer: DomSanitizer,
    private tutorFavoriteService: FavoriteService,
    private courseService: CourseService,
    private router: Router,
    public stateService: StateService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.tutor = this.route.snapshot.data['tutor'];
    this.seoService.setMetaTitle(this.tutor.name);
    this.config = this.stateService.getState(STATE.CONFIG);
    this.webUrl = environment.url;
    this.seoService.addMetaTags([
      {
        property: 'og:title',
        content: this.tutor.name
      },
      {
        property: 'og:image',
        content: this.tutor.avatarUrl
      },
      {
        property: 'og:description',
        content: 'Livelearn is online learning platform'
      }
    ]);
  }

  ngOnInit() {
    this.languages = this.languageService.getLang();
    this.objectLanguage = this.languageService.languages;
    this.isLoggedin = this.authService.isLoggedin();
    this.optionsReview.rateTo = this.tutor._id;
    this.statsReview = {
      ...this.statsReview,
      ...{
        ratingAvg: this.tutor.ratingAvg,
        totalRating: this.tutor.totalRating,
        ratingScore: this.tutor.ratingScore
      }
    };
    if (this.tutor.languages) {
      this.mapLanguageName(this.tutor.languages);
    }
    if (this.tutor.gradeItems && this.tutor.gradeItems.length > 0) {
      this.mapGradeName(this.tutor.gradeItems);
    }
    this.queryWebinar();
    this.queryCourse();
    if (this.tutor && this.tutor.bio && this.tutor.bio.length > this.showChar) {
      this.showMore = true;
    }

    this.urlYoutube = this.setUrl(this.tutor.idYoutube);
  }

  queryWebinar() {
    this.webinarService
      .search({
        page: this.webinarOptions.currentPage,
        take: this.webinarOptions.pageSize,
        sort: `${this.webinarOptions.sortOption.sortBy}`,
        sortType: `${this.webinarOptions.sortOption.sortType}`,
        isOpen: true,
        tutorId: this.tutor._id || '',
        disabled: false,
        ...this.searchFields
      })
      .then((resp) => {
        this.webinarOptions.count = resp.data.count;
        this.webinarOptions.webinars = resp.data.items;
      })
      .catch(() => this.appService.toastError());
  }
  queryCourse() {
    this.courseService
      .search({
        page: this.courseOptions.currentPage,
        take: this.courseOptions.pageSize,
        sort: `${this.courseOptions.sortOption.sortBy}`,
        sortType: `${this.courseOptions.sortOption.sortType}`,
        isOpen: true,
        tutorId: this.tutor._id || '',
        approved: true,
        disabled: false,
        ...this.searchFields
      })
      .then((resp) => {
        this.courseOptions.count = resp.data.count;
        this.courseOptions.courses = resp.data.items;
      })
      .catch(() => this.appService.toastError());
  }

  mapGradeName(gradeItems: any) {
    gradeItems.forEach((grade: any) => {
      this.gradeNames.push(grade?.name);
    });
  }

  mapLanguageName(languageKeys: any) {
    languageKeys.forEach((lang: any) => {
      this.languageNames.push(this.objectLanguage[lang]);
    });
  }

  setUrl(idYoutube: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${idYoutube}`
    );
  }

  favorite() {
    if (!this.isLoggedin)
      this.appService.toastError('Please Log in to add to your favorites');
    else {
      this.tutorFavoriteService
        .favorite(
          {
            tutorId: this.tutor._id,
            type: 'tutor'
          },
          'tutor'
        )
        .then(() => {
          this.tutor.isFavorite = true;
          this.appService.toastSuccess(
            'Added to your favorite tutor list successfully!'
          );
        })
        .catch(() => this.appService.toastError());
    }
  }

  unFavorite() {
    if (!this.isLoggedin)
      this.appService.toastError('Please loggin to use this feature!');
    else {
      this.tutorFavoriteService
        .unFavorite(this.tutor._id, 'tutor')
        .then(() => {
          this.tutor.isFavorite = false;
          this.appService.toastSuccess(
            'Removed from your favorite tutor list successfully'
          );
        })
        .catch(() => this.appService.toastError());
    }
  }

  clickCategory(catId: any) {
    const categoryIds = [];
    categoryIds.push(catId);
    this.searchFields.categoryIds = categoryIds.join(',');
    this.router.navigate(['/categories'], {
      queryParams: { categoryIds: this.searchFields.categoryIds }
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      (function ($) {
        $(document).ready(function () {
          $('#btn-view-webinars').click(function () {
            $('html, body').animate(
              {
                scrollTop: ($('#view-webinars') as any).offset().top
              },
              300
            );
          });
          $('#btn-view-courses').click(function () {
            $('html, body').animate(
              {
                scrollTop: ($('#view-courses') as any).offset().top
              },
              300
            );
          });
        });
      })(jQuery);
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
}
