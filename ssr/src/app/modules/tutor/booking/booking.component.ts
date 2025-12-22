import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer } from '@angular/platform-browser';
import {
  IBooking,
  ICoupon,
  ICourse,
  IMyCategory,
  IMySubject,
  IMyTopic,
  IUser,
  IWebinar
} from 'src/app/interface';
import {
  AppService,
  AppointmentService,
  AuthService,
  CartService,
  CouponService,
  CourseService,
  FavoriteService,
  LanguageService,
  MyCategoryService,
  MySubjectService,
  MyTopicService,
  STATE,
  SeoService,
  StateService,
  WebinarService
} from 'src/app/services';
import { environment } from 'src/environments/environment';
import { ConfirmModalComponent } from 'src/app/components/booking/confirm/confirm.component';

@Component({
  templateUrl: './booking.html'
})
export class BookingComponent implements OnInit {
  public tutor: IUser;
  public booking: IBooking = {
    startTime: '',
    toTime: '',
    tutorId: '',
    targetId: '',
    redirectSuccessUrl: '',
    cancelUrl: '',
    isFree: false,
    couponCode: ''
  };
  public zipCode: any;
  public timeSelected: any;
  public submitted = false;
  public loading = false;
  public subject: IMySubject;
  public isLoggedin = false;
  public showMore = false;
  public showChar = 500;
  // tslint:disable-next-line:max-line-length
  public urlYoutube: any;
  public languages: any;
  public languageNames: any = [];
  public objectLanguage: any = {};

  public maxFreeSlotToBook: number;
  public salePrice = 0;
  public coupon: ICoupon;
  public saleValue: any;
  public usedCoupon = false;
  public appliedCoupon = false;
  public couponCode: any = '';
  public optionsCoupon: any = {
    tutorId: '',
    targetType: 'subject'
  };

  public price: number;

  public webinarOptions = {
    webinars: [] as IWebinar[],
    currentPage: 1,
    pageSize: 6,
    sortOption: {
      sortBy: 'createdAt',
      sortType: 'asc'
    },
    count: 0
  };
  public courseOptions = {
    courses: [] as ICourse[],
    currentPage: 1,
    pageSize: 6,
    sortOption: {
      sortBy: 'createdAt',
      sortType: 'asc'
    },
    count: 0
  };
  public config: any;

  public myCategories: IMyCategory[] = [];
  public mySubjects: IMySubject[] = [];
  public myTopics: IMyTopic[] = [];
  public filterMyCategory: any = {
    currentPage: 1,
    pageSize: 10,
    sortOption: {
      sortBy: 'createdAt',
      sortType: 'desc'
    },
    total: 0,
    loading: false
  };

  public filterMySubject: any = {
    currentPage: 1,
    pageSize: 10,
    sortOption: {
      sortBy: 'createdAt',
      sortType: 'desc'
    },
    myCategoryId: '',
    total: 0,
    loading: false
  };

  public filterMyTopic: any = {
    currentPage: 1,
    pageSize: 10,
    sortOption: {
      sortBy: 'createdAt',
      sortType: 'desc'
    },
    myCategoryId: '',
    mySubjectId: '',
    total: 0,
    loading: false
  };

  public selectedCategoryId = '';
  public selectedSubjectId = '';

  public topic: IMyTopic;
  currentUser: IUser;
  hiddenSlot = false;
  constructor(
    private route: ActivatedRoute,
    private appointmentService: AppointmentService,
    private router: Router,
    private modalService: NgbModal,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private languageService: LanguageService,
    private webinarService: WebinarService,
    private tutorFavoriteService: FavoriteService,
    private couponService: CouponService,
    private courseService: CourseService,
    private mySubjectService: MySubjectService,
    private myCategoryService: MyCategoryService,
    private myTopicService: MyTopicService,
    private appService: AppService,
    public stateService: StateService,
    private cartService: CartService,
    private seo: SeoService
  ) {
    this.tutor = this.route.snapshot.data['tutor'];
    this.seo.setMetaTitle(`${this.tutor.name} Schedule`);
    this.seo.addMetaTags([
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
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
    this.route.queryParams.subscribe((params) => {
      if (params.isFree && params.isFree === 'true') {
        this.booking.isFree = true;
      }
    });
    this.config = this.stateService.getState(STATE.CONFIG);
    this.maxFreeSlotToBook = this.config.maxFreeSlotToBook;

    this.price = this.tutor.price1On1Class;
    this.booking.tutorId = this.tutor._id;
    this.isLoggedin = this.authService.isLoggedin();
    this.urlYoutube = this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${this.tutor.idYoutube}`
    );
    this.languages = this.languageService.getLang();
    this.objectLanguage = this.languageService.languages;
    if (this.tutor.languages) {
      this.mapLanguageName(this.tutor.languages);
    }
    if (this.tutor) {
      this.queryWebinar();
      this.queryCourse();
      this.salePrice = this.tutor.price1On1Class;
      this.queryMyCategories();
    }

    this.optionsCoupon.tutorId = this.tutor._id;
    this.optionsCoupon.targetId = this.tutor._id;
    if (this.tutor && this.tutor.bio && this.tutor.bio.length > this.showChar) {
      this.showMore = true;
    }
  }

  chooseSlot(time: any) {
    if (!this.isLoggedin) {
      return this.appService.toastError(
        'Please Log in to book the 1-1 class appointment'
      );
    }
    this.timeSelected = {
      startTime: time.start,
      toTime: time.end
    };
    const currentTutorInCart = this.cartService.getTutorId();
    const cartItems = this.cartService.getItemsInCart('subject');
    if (
      currentTutorInCart &&
      currentTutorInCart !== this.tutor._id &&
      cartItems.length > 0
    ) {
      return this.appService.toastError(
        'You cannot add classes from different tutors'
      );
    }

    if (this.booking.targetId === '' || this.booking.subjectId === null) {
      this.appService.toastError('Please choose category, subject and topic');
      this.submitted = false;
      this.loading = false;
      return;
    }
    this.cartService.updateTutorId(this.tutor._id);
    this.cartService.updateCart({
      product: {
        ...this.timeSelected,
        targetId: this.booking.targetId,
        targetInfo: {
          name: this.topic.name
        }
      },
      quantity: 1,
      price:
        !this.usedCoupon && this.appliedCoupon ? this.salePrice : this.price,
      originalPrice: this.price,
      type: 'subject',
      couponCode:
        !this.usedCoupon &&
        this.appliedCoupon &&
        this.coupon &&
        this.coupon.code
          ? this.coupon.code
          : ''
    });

    this.appliedCoupon = false;
    this.usedCoupon = true;
  }

  buyNow(time: any) {
    if (!this.isLoggedin) {
      return this.appService.toastError(
        'Please Log in to book the 1-1 class appointment'
      );
    }

    if (this.booking.targetId === '' || this.booking.subjectId === null) {
      this.appService.toastError('Please choose subject and topic');
      this.submitted = false;
      this.loading = false;
      return;
    }

    this.timeSelected = {
      startTime: time.start,
      toTime: time.end
    };

    this.booking.startTime = this.timeSelected.startTime;
    this.booking.toTime = this.timeSelected.toTime;

    this.appointmentService
      .checkOverlap({
        startTime: this.timeSelected.startTime,
        toTime: this.timeSelected.toTime
      })
      .then((resp) => {
        if (resp.data.checkOverlap) {
          if (
            window.confirm(
              'This slot is overlap with your booked slot. Still book it?'
            )
          ) {
            this.bookingAppointment();
          }
        } else {
          this.bookingAppointment();
        }
      })
      .catch((e) => {
        this.appService.toastError(e);
      });
  }

  bookingAppointment() {
    if (!this.isLoggedin) {
      return this.appService.toastError(
        'Please Log in to book the 1-1 class appointment'
      );
    }
    this.submitted = true;
    this.booking.redirectSuccessUrl =
      environment.url + this.router.url + '/success';
    this.booking.cancelUrl = environment.url + this.router.url + '/cancel';
    // this.booking.isFree = false;
    if (
      !this.usedCoupon &&
      this.coupon &&
      this.coupon._id &&
      this.appliedCoupon
    ) {
      this.booking.couponCode = this.coupon.code;
    }

    const modalStripe = this.modalService.open(ConfirmModalComponent, {
      size: 'lg'
    });
    modalStripe.componentInstance.subject = this.subject;
    modalStripe.componentInstance.tutor = this.tutor;
    modalStripe.componentInstance.slot = this.timeSelected;
    modalStripe.componentInstance.price = modalStripe.componentInstance.price =
      this.booking.isFree
        ? 0
        : this.appliedCoupon
        ? this.salePrice
        : this.price;
    modalStripe.componentInstance.config = this.config;
    modalStripe.componentInstance.appliedCoupon = this.appliedCoupon;
    if (
      !this.usedCoupon &&
      this.coupon &&
      this.coupon._id &&
      this.appliedCoupon
    ) {
      this.booking.couponCode = this.coupon.code;
    }
    modalStripe.result.then(
      (result) => {
        if (result.confirmed) {
          if (this.booking.isFree) {
            this.appointmentService
              .checkFree({ tutorId: this.booking.tutorId })
              .then((resp) => {
                if (
                  resp.data.canBookFree === true &&
                  resp.data.canBookFreeWithTutor
                ) {
                  this.appointmentService
                    .create(this.booking)
                    .then(() => {
                      this.appService.toastSuccess('Booking successfully!');
                      this.submitted = false;
                      return this.router.navigate(['/users/lessons']);
                    })
                    .catch((err) => {
                      this.submitted = false;
                      this.router.navigate(['/payments/cancel']);
                      this.appService.toastError(err);
                    });
                } else {
                  if (resp.data.canBookFree === false) {
                    this.submitted = false;
                    return this.appService.toastError(
                      'You have taken for the maximum number of free trial classes'
                    );
                  }
                  if (resp.data.canBookFreeWithTutor === false) {
                    this.submitted = false;
                    return this.appService.toastError(
                      'You have taken a free trial class of this tutor before'
                    );
                  }
                }
              });
          } else if (this.salePrice <= 0 && this.appliedCoupon) {
            this.appointmentService
              .create(this.booking)
              .then(() => {
                this.appService.toastSuccess('Booking successfully!');
                this.submitted = false;
                return this.router.navigate(['/users/lessons']);
              })
              .catch((err) => {
                this.submitted = false;
                this.router.navigate(['/payments/cancel']);
                this.appService.toastError(err.data.message);
              });
          } else {
            localStorage.setItem('paymentParams', JSON.stringify(this.booking));
            this.submitted = false;
            return this.router.navigate(['/payments/pay'], {
              queryParams: {
                type: 'booking',
                targetType: 'subject',
                targetName: this.subject.name,
                tutorName: this.tutor.name
              },
              state: this.booking
            });
          }
        } else {
          this.submitted = false;
          return;
        }
      },
      () => {
        return;
      }
    );
  }

  mapLanguageName(languageKeys: any) {
    languageKeys.forEach((key: string) => {
      this.languageNames.push(this.objectLanguage[key]);
    });
  }

  changeTopic() {
    this.topic = this.myTopics.find(
      (item) => item._id === this.booking.targetId
    ) as IMyTopic;
    if (this.topic) {
      this.price = this.topic.price;
      this.optionsCoupon.topicId = this.topic._id;
    }
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
        disabled: false
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
        tutorId: this.tutor._id || ''
      })
      .then((resp) => {
        this.courseOptions.count = resp.data.count;
        this.courseOptions.courses = resp.data.items;
      })
      .catch(() => this.appService.toastError());
  }

  favorite() {
    if (!this.isLoggedin)
      this.appService.toastError('Please Log in to add to your favorites!');
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

  fundTransfer() {
    this.router.navigate(['/tutors/zipCode'], {
      queryParams: { zipCode: this.zipCode }
    });
  }

  checkUsedCoupon(used: boolean) {
    this.usedCoupon = used;
  }

  applyCoupon(event: { appliedCoupon: boolean; coupon: ICoupon }) {
    const items = this.cartService.getItemsInCart('subject');
    if (items.length > 0) {
      let found = false;
      items.forEach((item) => {
        if (found) {
          return;
        }
        if (item.couponCode) {
          found = true;
        }
      });
      if (found) {
        return this.appService.toastError(
          'You can only use the discount code for one slot'
        );
      }
    }
    this.appliedCoupon = event.appliedCoupon;
    if (this.appliedCoupon && event.coupon && this.authService.isLoggedin()) {
      this.coupon = event.coupon;
      if (event.coupon.type === 'percent') {
        this.saleValue = event.coupon.value;
        const countPricePercent =
          this.price - this.price * (this.saleValue / 100);
        this.salePrice = countPricePercent > 0 ? countPricePercent : 0;
      } else if (event.coupon.type === 'money') {
        this.saleValue = event.coupon.value;
        const countPriceMoney = this.price - this.saleValue;
        this.salePrice = countPriceMoney > 0 ? countPriceMoney : 0;
      }
      this.appService.toastSuccess('Applied coupon');
    } else {
      this.salePrice = this.price || 0;
    }
  }

  onCancelCoupon(event: { cancelled: boolean }) {
    if (event.cancelled) {
      this.salePrice = this.price || 0;
      this.saleValue = 0;
      this.appliedCoupon = false;
      this.coupon = {} as ICoupon;
    }
  }

  getCurrentCoupon() {
    this.couponService
      .getCurrentCoupon({
        targetType: this.optionsCoupon.targetType,
        tutorId: this.optionsCoupon.tutorId
      })
      .then((resp) => {
        if (resp && resp.data) {
          this.coupon = resp.data;
          if (this.coupon && this.authService.isLoggedin()) {
            this.optionsCoupon.couponId = this.coupon._id;
          }
        }
      });
  }

  queryMyCategories() {
    this.filterMyCategory.loading = true;
    this.myCategoryService
      .search({
        page: this.filterMyCategory.currentPage,
        take: this.filterMyCategory.pageSize,
        sort: `${this.filterMyCategory.sortOption.sortBy}`,
        sortType: `${this.filterMyCategory.sortOption.sortType}`,
        tutorId: this.tutor._id
      })
      .then((resp) => {
        if (resp.data && resp.data.items) {
          this.filterMyCategory.total = resp.data.count;
          this.myCategories = resp.data.items;
        }
        this.filterMyCategory.loading = false;
      })
      .catch((err) => {
        this.filterMyCategory.loading = false;
        return this.appService.toastError(err);
      });
  }

  selectMyCategory() {
    this.filterMySubject.myCategoryId = this.selectedCategoryId;
    this.mySubjects = [];
    this.myTopics = [];
    this.booking.targetId = '';
    this.selectedSubjectId = '';
    this.booking.targetId = '';
    if (this.selectedCategoryId) {
      this.queryMySubjects();
    }
  }

  queryMySubjects() {
    this.filterMySubject.loading = true;
    this.mySubjectService
      .search({
        page: this.filterMySubject.currentPage,
        take: this.filterMySubject.pageSize,
        sort: `${this.filterMySubject.sortOption.sortBy}`,
        sortType: `${this.filterMySubject.sortOption.sortType}`,
        myCategoryId: this.filterMySubject.myCategoryId,
        tutorId: this.tutor._id
      })
      .then((resp) => {
        if (resp.data && resp.data.items) {
          this.filterMySubject.total = resp.data.count;
          this.mySubjects = resp.data.items;
        }
        this.filterMySubject.loading = false;
      })
      .catch((err) => {
        this.filterMySubject.loading = false;
        return this.appService.toastError(err);
      });
  }

  selectMySubject() {
    this.filterMyTopic.mySubjectId = this.selectedSubjectId;
    this.filterMyTopic.myCategoryId = this.selectedCategoryId;
    this.myTopics = [];
    this.booking.targetId = '';
    if (this.selectedSubjectId && this.selectedCategoryId) {
      this.queryMyTopics();
      this.subject = this.mySubjects.find(
        (item) => item._id === this.selectedSubjectId
      ) as IMySubject;
    }
  }

  queryMyTopics() {
    this.filterMyTopic.loading = true;
    this.myTopicService
      .search({
        page: this.filterMyTopic.currentPage,
        take: this.filterMyTopic.pageSize,
        sort: `${this.filterMyTopic.sortOption.sortBy}`,
        sortType: `${this.filterMyTopic.sortOption.sortType}`,
        mySubjectId: this.filterMyTopic.mySubjectId,
        myCategoryId: this.filterMyTopic.myCategoryId,
        tutorId: this.tutor._id
      })
      .then((resp) => {
        if (resp.data && resp.data.items) {
          this.filterMyTopic.total = resp.data.count;
          this.myTopics = resp.data.items;
        }
        this.filterMyTopic.loading = false;
      })
      .catch((err) => {
        this.filterMyTopic.loading = false;
        return this.appService.toastError(err);
      });
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

  clickCategory(catId: any) {
    this.router.navigate(['/categories'], {
      queryParams: { categoryIds: catId }
    });
  }
}
