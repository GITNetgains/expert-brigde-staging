import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { IUser } from 'src/app/interface';
import {environment} from 'src/environments/environment';

import {
  AuthService,
  AppointmentService,
  PaymentService,
  CountryService,
  CartService,
  AppService
} from 'src/app/services';

declare var Razorpay: any;

@Component({
  selector: 'app-pay',
  templateUrl: './pay.html'
})
export class PayComponent implements OnInit {

  public paymentForm!: FormGroup;
  public loading = false;
  public submitted = false;

  public paymentParams: any;
  public paymentIntent: any;

  public type!: string;
  public targetType!: string;
  public targetName!: string;
  public tutorName!: string;
  public title = '';

  public countries: any;
  public currentUser!: IUser;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private auth: AuthService,
    private route: ActivatedRoute,
    private appointmentService: AppointmentService,
    private paymentService: PaymentService,
    private countryService: CountryService,
    private cartService: CartService,
    private appService: AppService
  ) {
    if (this.auth.isLoggedin()) {
      this.auth.getCurrentUser().then(user => {
        this.currentUser = user;
      });
    }

    this.type = this.route.snapshot.queryParams.type;
    this.targetType = this.route.snapshot.queryParams.targetType;
    this.targetName = this.route.snapshot.queryParams.targetName;
    this.tutorName = this.route.snapshot.queryParams.tutorName;
    this.title = this.route.snapshot.queryParams.title;

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        const nav = this.router.getCurrentNavigation();
        if (nav?.extras?.state) {
          this.paymentParams = nav.extras.state;
        }
      });
  }

  ngOnInit(): void {
    if (!this.paymentParams) {
      const params = localStorage.getItem('paymentParams');
      if (params) {
        this.paymentParams = JSON.parse(params);
      } else {
        this.router.navigate(['/home']);
        return;
      }
    }

    this.countries = this.countryService.getCountry();

    this.paymentForm = this.fb.group({
      name: ['', Validators.required],
      emailRecipient: ['', Validators.email],
      address_line1: ['', Validators.required],
      address_city: ['', Validators.required],
      address_state: ['', Validators.required],
      address_country: [null, Validators.required]
    });
  }

  // ==========================
  // BUY
buy(): void {
  this.submitted = true;

  if (this.paymentForm.invalid) {
    this.appService.toastError('Please complete the required fields');
    return;
  }

  if (this.type === 'gift' && !this.paymentForm.value.emailRecipient) {
    this.appService.toastError('Please enter recipient email');
    return;
  }

  this.loading = true;

  const enrollPayload = {
    tutorId: this.paymentParams.tutorId,
    targetId: this.paymentParams.targetId,
    targetType: 'subject',
    redirectSuccessUrl: this.paymentParams.redirectSuccessUrl,
    cancelUrl: this.paymentParams.cancelUrl,
    couponCode: '',
    emailRecipient: ''
  };

  this.paymentService.enroll(enrollPayload)
    .then(resp => {

      // ✅ CORRECT RESPONSE ACCESS
      const payment = resp?.data;

      console.log('PAYMENT INIT RESPONSE:', payment);

      if (!payment?.razorpayOrderId || !payment?.amount || !payment?.transactionId) {
        throw new Error('Payment init failed');
      }

      this.loading = false;

      this.openRazorpay({
        transactionId: payment.transactionId,
        razorpayOrderId: payment.razorpayOrderId,
        amount: payment.amount
      });

    })
    .catch(err => {
      this.loading = false;
      this.appService.toastError(err.message || err);
    });
}






  // ==========================
  // RAZORPAY CHECKOUT
  // ==========================
openRazorpay(payment: any): void {

  if (!payment?.razorpayOrderId || !payment?.amount) {
    console.error('Invalid Razorpay payload', payment);
    this.loading = false;
    this.appService.toastError('Payment initialization failed');
    return;
  }

  const options = {
    key: environment.razorpayKey,
    amount: payment.amount * 100,
    currency: 'INR',
    name: 'Expert Bridge',
    description: this.title || 'Payment',
    order_id: payment.razorpayOrderId,

    prefill: {
      name: this.paymentForm.value.name,
      email: this.currentUser?.email
    },

    handler: (response: any) => {
      this.paymentService
        .confirmRazorpay({
          transactionId: payment.transactionId,
          razorpayPaymentId: response.razorpay_payment_id
        })
        .finally(() => {
          this.cleanup();
          this.router.navigate(['/payments/success']);
        });
    },

    modal: {
      ondismiss: () => {
        this.loading = false;
        this.router.navigate(['/payments/cancel']);
      }
    }
  };

  new Razorpay(options).open();
}

  // ==========================
  // CLEANUP
  // ==========================
  cleanup(): void {
    this.loading = false;
    this.submitted = false;

    localStorage.removeItem('title');
    localStorage.removeItem('paymentParams');
    localStorage.removeItem('cartInfo');
    this.cartService.removeCart();
  }
}
