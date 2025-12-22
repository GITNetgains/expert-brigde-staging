import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import {
  ICoupon,
  IMylesson,
  IStatsReview,
  IUser,
  IWebinar
} from 'src/app/interface';
import {
  AppService,
  AuthService,
  CalendarService,
  FavoriteService,
  STATE,
  SeoService,
  StateService,
  WebinarService
} from 'src/app/services';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-webinar-detail',
  templateUrl: './detail.html'
})
export class DetailWebinarComponent implements OnInit {
  closeResult: string;
  public targetType: String = 'webinar';
  public webinarParam: string;
  public webinarId: String = '';
  public webinar: IWebinar;
  public slots: IMylesson[];
  public slotChunks: IMylesson[][];
  public isShowingMoreSlots = false;
  public emailRecipient: any = '';
  public salePrice: any;
  public coupon: ICoupon;
  public saleValue: any;
  public usedCoupon = false;
  public appliedCoupon = false;
  public couponCode: any = '';
  public canBooking = false;
  public currentUser: IUser;
  public booked = false;
  public isLoggedin = false;
  public slotLeft: number;

  public optionsReview: any = {
    webinarId: ''
  };
  public optionsCoupon: any = {
    webinarId: '',
    tutorId: '',
    targetType: 'webinar'
  };
  public type: any;
  public statsReview: IStatsReview = {
    ratingAvg: 0,
    ratingScore: 0,
    totalRating: 0
  };
  public config: any;
  public showBooking = false;
  public appliedCouponCode: string = '';

  constructor(
    private route: ActivatedRoute,
    private webinarService: WebinarService,
    private calendarService: CalendarService,
    private auth: AuthService,
    private appService: AppService,
    private router: Router,
    private webinarFavoriteService: FavoriteService,
    private stateService: StateService,
    private seoService: SeoService
  ) {
    this.webinarParam = this.route.snapshot.params['id'];
    this.config = this.stateService.getState(STATE.CONFIG);
    if (this.auth.isLoggedin()) {
      this.isLoggedin = true;
      this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
    }
    this.showBooking = this.stateService.showBooking();
    this.webinar = this.route.snapshot.data['webinar'];
    this.seoService.setMetaTitle(this.webinar.name);
    this.seoService.addMetaTags([
      {
        property: 'og:title',
        content: this.webinar.name
      },
      {
        property: 'og:image',
        content:
          this.webinar?.mainImage?.fileUrl ||
          (this.config?.homepagePicture &&
          this.config?.homepagePicture?.howItWork
            ? this.config?.homepagePicture?.howItWork
            : `${environment.url}/assets/images/tutors01.jpg`)
      },
      {
        property: 'og:description',
        content: 'Livelearn is online learning platform'
      }
    ]);
    this.populateDependent();
  }

  async ngOnInit() {
    if (!this.webinar) {
      await this.findOneWebinar();
    }
  }

  async findOneWebinar() {
    this.webinarService
      .findOne(this.webinarParam)
      .then(async (resp) => {
        this.webinar = resp.data;
        await this.populateDependent();
      })
      .catch((err) => {
        if (err.data.code == '404')
          this.router.navigate(['pages/404-not-found']);
        else {
          this.router.navigate(['pages/error', err.data.code]);
        }
      });
  }

  async populateDependent() {
    this.webinarId = this.webinar._id;
    this.optionsReview.webinarId = this.webinarId;
    if (this.webinar._id) {
      this.statsReview = {
        ...this.statsReview,
        ...{
          ratingAvg: this.webinar.ratingAvg,
          totalRating: this.webinar.totalRating,
          ratingScore: this.webinar.ratingScore
        }
      };
      this.optionsCoupon.tutorId = this.webinar.tutor._id;
      this.optionsCoupon.webinarId = this.webinar._id;
      if (this.webinar.coupon && this.auth.isLoggedin()) {
        this.optionsCoupon.couponId = this.webinar.coupon._id;
      }
      this.salePrice = this.webinar.price;
      this.slotLeft =
        this.webinar.maximumStrength - this.webinar.numberParticipants;

      await this.findSlots();
    }
  }

  async findSlots() {
    try {
      // find available slots
      const availableSlotsRes = await this.calendarService.search({
        webinarId: this.webinarId,
        take: 100,
        sort: 'startTime',
        sortType: 'asc',
        startTime: moment.utc().add(30, 'minutes').toDate().toISOString()
      });

      const availableSlots =
        availableSlotsRes && availableSlotsRes.data
          ? availableSlotsRes.data.items
          : [];

      // find past slots
      const pastSlotsRes = await this.calendarService.search({
        webinarId: this.webinarId,
        take: 100,
        sort: 'startTime',
        sortType: 'desc',
        toTime: moment.utc().add(30, 'minutes').toDate().toISOString()
      });

      const pastSlots =
        pastSlotsRes && pastSlotsRes.data ? pastSlotsRes.data.items : [];

      this.canBooking = availableSlots.length > 0;
      this.slots = [
        ...availableSlots.map((item: any) => ({ ...item, disable: false })),
        ...pastSlots.map((item: any) => ({ ...item, disable: true }))
      ];
    } catch (e) {
      console.log('finding slots error: ', e);
    }
  }

  enrollWebinar(webinar: any, type: string) {
    if (!this.auth.isLoggedin()) {
      const message =
        type === 'booking'
          ? 'Please Log in to buy the group class'
          : 'Please Log in to gift the Group class';
      return this.appService.toastError(message);
    }
    if (this.webinar.numberParticipants >= this.webinar.maximumStrength) {
      return this.appService.toastError('No slot available!');
    }
    if (type === 'booking') {
      return this.webinarService
        .checkOverlapWebinar({
          userId: this.currentUser._id,
          webinarId: this.webinar._id
        })
        .then((resp) => {
          if (resp.data.overlapSlots && resp.data.overlapSlots.length) {
            const count = resp.data.overlapSlots.length;
            const noti =
              count === 1
                ? '1 slot is overlap with your booked class. Still book?'
                : count +
                  ' slots are overlap with your booked classes. Still book?';
            if (window.confirm(noti)) {
              this.confirmEnroll(webinar, type);
            }
          } else {
            this.confirmEnroll(webinar, type);
          }
        });
    }
    return this.confirmEnroll(webinar, type);
  }

  confirmEnroll(webinar: any, type: string) {
    const params = Object.assign({
      targetType: this.targetType,
      targetId: webinar._id,
      tutorId: webinar.tutorId,
      redirectSuccessUrl: environment.url + '/payments/success',
      cancelUrl: environment.url + '/payments/cancel',
      type: type,
      emailRecipient: this.emailRecipient
    });
    if (this.appliedCouponCode && this.appliedCoupon) {
      params.couponCode = this.appliedCouponCode;
    }
    if (this.salePrice <= 0 || webinar.isFree) {
      return this.webinarService
        .enroll(params)
        .then((resp) => {
          if (resp.data.status === 'completed') {
            this.appService.toastSuccess(
              'Have successfully booked free group class'
            );
            return this.router.navigate(['/users/lessons']);
          } else {
            return this.router.navigate(['/payments/cancel']);
          }
        })
        .catch((e) => {
          this.appService.toastError(e);
          this.router.navigate(['/payments/cancel']);
        });
    } else {
      localStorage.setItem('paymentParams', JSON.stringify(params));
      return this.router.navigate(['/payments/pay'], {
        queryParams: {
          type: type,
          targetType: 'webinar',
          targetName: webinar.name,
          tutorName: webinar.tutor.name
        },
        state: params
      });
    }
  }

  checkUsedCoupon(used: boolean) {
    this.usedCoupon = used;
  }

  applyCoupon(event: { appliedCoupon: boolean; coupon: ICoupon }) {
    this.appliedCoupon = event.appliedCoupon;
    if (this.appliedCoupon) {
      this.appliedCouponCode = event.coupon.code;
      if (event.coupon.type === 'percent') {
        this.saleValue = event.coupon.value;
        this.salePrice =
          this.webinar.price - this.webinar.price * (this.saleValue / 100) <= 0
            ? 0
            : this.webinar.price - this.webinar.price * (this.saleValue / 100);
      } else if (event.coupon.type === 'money') {
        this.saleValue =
          event.coupon.value > this.webinar.price
            ? this.webinar.price
            : event.coupon.value;
        this.salePrice = this.webinar.price - this.saleValue;
      }
      this.appService.toastSuccess('Applied coupon');
    } else {
      this.salePrice = this.webinar.price || 0;
    }
  }

  onCancelCoupon(event: { cancelled: boolean }) {
    if (event.cancelled) {
      this.salePrice = this.webinar.price || 0;
      this.saleValue = 0;
      this.appliedCoupon = false;
      this.appliedCouponCode = '';
    }
  }

  favorite() {
    if (!this.isLoggedin)
      this.appService.toastError('Please Log in to add to your favorites');
    else {
      this.webinarFavoriteService
        .favorite(
          {
            webinarId: this.webinar._id,
            type: 'webinar'
          },
          'webinar'
        )
        .then(() => {
          this.webinar.isFavorite = true;
          this.appService.toastSuccess(
            'Added to your favorite webinar list successfully!'
          );
        })
        .catch(() => this.appService.toastError());
    }
  }

  unFavorite() {
    if (!this.isLoggedin)
      this.appService.toastError('Please loggin to use this feature!');
    else {
      this.webinarFavoriteService
        .unFavorite(this.webinar._id, 'webinar')
        .then(() => {
          this.webinar.isFavorite = false;
          this.appService.toastSuccess(
            'Deleted from your favorite webinar list successfully!'
          );
        })
        .catch(() => this.appService.toastError());
    }
  }
}
