import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  TutorService,
  AuthService,
  SeoService,
  StateService,
  STATE,
  AppService
} from 'src/app/services';
import { environment } from 'src/environments/environment';
import * as jQuery from 'jquery';
@Component({
  selector: 'app-teach-with-us',
  templateUrl: './teach.html'
})
export class TeachWithUsComponent implements OnInit {
  public tutors: any[];
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
  public banner = 'url(' + 'assets/how-it-works/livelearn-bg.svg' + ')';
  public banner_sm = 'url(' + 'assets/images/teach-with-us-banner.png' + ')';
  constructor(
    public router: Router,
    private tutorService: TutorService,
    private authService: AuthService,
    private seoService: SeoService,
    private stateService: StateService,
    private appService: AppService
  ) {
    this.seoService.setMetaTitle('Teach with us');
    this.config = this.stateService.getState(STATE.CONFIG);
    this.seoService.addMetaTags([
      {
        property: 'og:title',
        content: 'Make a global impact'
      },
      {
        property: 'og:image',
        content:
          this.config?.teachWithUsPicture &&
          this.config?.teachWithUsPicture?.banner
            ? this.config?.teachWithUsPicture?.banner
            : `${environment.url}/assets/images/tutors01.jpg`
      },
      {
        property: 'og:description',
        content:
          'Register as a tutor with us and earn money creating online courses, taking live classes, and hosting webinars for learners around the world.'
      },
      {
        name: 'keywords',
        content: 'Become a Tutor'
      }
    ]);
  }

  ngOnInit() {
    if (Object.keys(this.config).length > 0) {
      if (
        this.config.teachWithUsPicture &&
        this.config.teachWithUsPicture.banner
      ) {
        this.banner = `url(${this.config.teachWithUsPicture.banner})`;
      }

      if (
        this.config.teachWithUsPicture &&
        this.config.teachWithUsPicture.banner_sm
      ) {
        this.banner_sm = this.config.teachWithUsPicture.banner_sm;
      }
    }
    (function ($) {
      $(document).ready(function () {
        $('.counter').each(function (this: any) {
          const $this = $(this);
          const countTo = $this.attr('data-count');

          $({ countNum: $this.text() }).animate(
            {
              countNum: countTo
            },

            {
              duration: 8000,
              easing: 'linear',
              step: function () {
                $this.text(Math.floor(Number(this.countNum)));
              },
              complete: function () {
                $this.text(this.countNum);
              }
            }
          );
        });
      });
    })(jQuery);
    this.queryTutors();
  }

  queryTutors() {
    this.tutorService
      .search({
        page: 0,
        take: 10,
        sort: 'createdAt',
        sortType: 'asc',
        isHomePage: true,
        rejected: false,
        pendingApprove: false
      })
      .then((resp) => {
        this.tutors = resp.data.items;
      })
      .catch(() => this.appService.toastError());
  }

  becomeInstructor() {
    this.authService.removeToken();
    this.router.navigate(['/auth/sign-up']);
  }
}
