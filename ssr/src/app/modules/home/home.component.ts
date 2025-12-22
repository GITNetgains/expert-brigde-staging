import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { ICourse } from 'src/app/interface';
import {
  AppService,
  AuthService,
  STATE,
  SeoService,
  StateService,
  WebinarService
} from 'src/app/services';
import { CourseService } from 'src/app/services/course.service';
import { TestimonialService } from 'src/app/services/testimonial.service';
import { TutorService } from 'src/app/services/tutor.service';
import { environment } from 'src/environments/environment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ViewYoutubeModalComponent } from 'src/app/components/home/view-video/popup.component';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  isBrowser = false;
  isServer = false;
  public currentUser: any;
  public categories: any;
  public count = 0;
  public webinars = [];
  public currentPage = 1;
  public pageSize = 4;
  public searchFields: any = {};
  public sortOption = {
    sortBy: 'createdAt',
    sortType: 'desc'
  };
  public queryParams: any;
  public categoryName: string;
  public config: any;
  public tutors: any[];
  public slideConfig = {
    centerMode: false,
    centerPadding: '60px',
    dots: false,
    infinite: true,
    speed: 1000,
    slidesToShow: 3,
    slidesToScroll: 3,
    autoplaySpeed: 1000,
    arrows: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          centerMode: false,
          dots: true,
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
          dots: true,
          centerPadding: '40px',
          slidesToShow: 1,
          vertical: false,
          slidesToScroll: 1
        }
      }
    ]
  };
  public slideFullConfig = {
    centerMode: false,
    centerPadding: '60px',
    dots: false,
    infinite: true,
    speed: 1000,
    slidesToShow: 3,
    slidesToScroll: 3,
    autoplaySpeed: 1000,
    arrows: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          centerMode: false,
          dots: true,
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
          dots: true,
          centerPadding: '40px',
          slidesToShow: 1,
          vertical: false,
          slidesToScroll: 1
        }
      }
    ]
  };
  public testimonials: any[] = [];
  public courses: ICourse[] = [];
  background_how_it_work_block = "url('assets/images/bg-red-pattern.png')";
  background_teach_with_us_block = "url('assets/bg-vector.svg')";
  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private seoService: SeoService,
    private webinarService: WebinarService,
    private tutorService: TutorService,
    private testimonialService: TestimonialService,
    private sanitizer: DomSanitizer,
    private courseService: CourseService,
    public stateService: StateService,
    private appService: AppService,
    private modalService: NgbModal
  ) {
    const listCategories = this.route.snapshot.data['categories'];
    this.categories = listCategories.slice(0, 12);
    this.config = this.stateService.getState(STATE.CONFIG);
    const { homeSEO, siteName } = this.config;
    this.seoService.setMetaTitle(siteName);
    this.seoService.setMetaDescription(homeSEO?.description);
    this.seoService.addMetaTags([
      {
        property: 'og:title',
        content: this.config?.siteName
      },
      {
        property: 'og:image',
        content:
          this.config?.homepagePicture &&
          this.config?.homepagePicture?.howItWork
            ? this.config?.homepagePicture?.howItWork
            : `${environment.url}/assets/images/tutors01.jpg`
      },
      {
        property: 'og:description',
        content: homeSEO?.description || 'Livelearn is online learning platform'
      },
      {
        name: 'keywords',
        content: homeSEO?.keywords
      }
    ]);
  }

  ngOnInit() {
    this.queryParams = this.route.snapshot.queryParams;
    if (this.config) {
      if (
        this.config.homepagePicture &&
        this.config.homepagePicture.background_how_it_work_block
      ) {
        this.background_how_it_work_block = `url(${this.config.homepagePicture.background_how_it_work_block})`;
      }

      if (
        this.config.homepagePicture &&
        this.config.homepagePicture.background_teach_with_us_block
      ) {
        this.background_teach_with_us_block = `url(${this.config.homepagePicture.background_teach_with_us_block})`;
      }
    }

    if (this.authService.isLoggedin()) {
      this.authService
        .getCurrentUser()
        .then((resp: any) => (this.currentUser = resp));
    }
    if (this.appService.isBrowser) {
      this.queryWebinars();
      this.queryTutors();
      this.queryCourse();
      this.queryTestimonial();
    }
  }

  queryWebinars() {
    this.webinarService
      .search({
        page: this.currentPage,
        take: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
        isOpen: true,
        tutorId: this.queryParams.tutorId || '',
        // isAvailable: true,
        disabled: false,
        ...this.searchFields
      })
      .then((resp) => {
        this.webinars = resp.data.items;
      })
      .catch(() => this.appService.toastError());
  }

  queryCourse() {
    this.courseService
      .search({
        page: this.currentPage,
        take: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
        approved: true,
        disabled: false,
        ...this.searchFields
      })
      .then((resp) => {
        this.courses = resp.data.items;
      })
      .catch(() => this.appService.toastError());
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
        this.count = resp.data.count;
        this.tutors = resp.data.items;
      })
      .catch(() => this.appService.toastError());
  }

  queryTestimonial() {
    this.testimonialService
      .search({ take: 50 })
      .then((resp) => {
        const data = resp.data.items;
        if (data.length) {
          this.testimonials = data.map((item: any) =>
            Object.assign(item, {
              urlYoutube: `https://i.ytimg.com/vi/${item.idYoutube}/maxresdefault.jpg`
            })
          );
        }
      })
      .catch(() => this.appService.toastError());
  }

  selectCategory(category: any) {
    if (category && this.searchFields.categoryIds !== category._id) {
      this.searchFields.categoryIds = category._id || '';
      this.queryWebinars();
    } else if (!category && this.searchFields.categoryIds !== '') {
      this.searchFields.categoryIds = '';
      this.queryWebinars();
    }
    this.categoryName = category.name || '';
  }

  setUrl(idYoutube: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${idYoutube}`
    );
  }

  viewYoutubeVideo(idYoutube: string) {
    if (!idYoutube) {
      return;
    }

    const modalRef = this.modalService.open(ViewYoutubeModalComponent, {
      centered: true,
      size: 'lg'
    });

    modalRef.componentInstance['idYoutube'] = idYoutube;
  }
}
