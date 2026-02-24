import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { IUser } from 'src/app/interface';
import { environment } from 'src/environments/environment';

import {
  AuthService,
  AppointmentService,
  PaymentService,
  CartService,
  AppService
} from 'src/app/services';

declare var Razorpay: any;

@Component({
  selector: 'app-pay',
  templateUrl: './pay.html',
  styleUrls: ['./pay.component.scss']
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

  public currentUser!: IUser;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private auth: AuthService,
    private route: ActivatedRoute,
    private appointmentService: AppointmentService,
    private paymentService: PaymentService,
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

    const emailValidators = this.type === 'gift'
      ? [Validators.required, Validators.email]
      : [Validators.email];

    this.paymentForm = this.fb.group({
      emailRecipient: ['', emailValidators]
    });
  }

  isPayDisabled(): boolean {
    if (this.loading) return true;
    if (this.type === 'gift') {
      const email = this.paymentForm.get('emailRecipient')?.value;
      if (this.paymentForm.get('emailRecipient')?.invalid || !email?.trim()) return true;
      if (email?.trim() === this.currentUser?.email) return true;
    }
    return false;
  }

  buy(): void {
    this.submitted = true;

    if (this.type === 'gift') {
      const email = this.paymentForm.get('emailRecipient')?.value?.trim();
      if (!email) {
        this.appService.toastError('Please enter recipient email');
        return;
      }
      if (this.paymentForm.get('emailRecipient')?.invalid) {
        this.appService.toastError('Please enter a valid recipient email');
        return;
      }
      if (email === this.currentUser?.email) {
        this.appService.toastError('Recipient email cannot be your own email');
        return;
      }
    }

    this.loading = true;

    const isEnrollFlow = this.paymentParams?.targetType === 'webinar' || this.paymentParams?.targetType === 'course';
    if (isEnrollFlow) {
      const enrollParams = { ...this.paymentParams };
      if (this.type === 'gift') {
        enrollParams.emailRecipient = this.paymentForm.get('emailRecipient')?.value?.trim();
      }
      this.paymentService.enroll(enrollParams)
        .then(resp => {
          const payment = resp?.data?.enroll ?? resp?.data;
          if (!payment?.razorpayOrderId || !payment?.amount || !payment?.transactionId) {
            throw new Error('Payment init failed');
          }
          this.paymentIntent = payment;
          this.loading = false;
          this.openRazorpay({
            transactionId: payment.transactionId,
            razorpayOrderId: payment.razorpayOrderId,
            amount: payment.amount
          });
        })
        .catch(err => {
          this.loading = false;
          this.submitted = false;
          this.cleanup();
          this.appService.toastError(err?.data?.message || err?.message || err);
          this.router.navigate(['/payments/cancel']);
        });
      return;
    }

    if (this.paymentParams?.times && this.paymentParams.times.length > 0) {
      this.appointmentService.checkout(this.paymentParams)
        .then(resp => {
          const payment = resp?.data;
          if (!payment?.razorpayOrderId || !payment?.amount || !payment?.transactionId) {
            throw new Error('Payment init failed');
          }
          this.paymentIntent = payment;
          this.loading = false;
          this.openRazorpay({
            transactionId: payment.transactionId,
            razorpayOrderId: payment.razorpayOrderId,
            amount: payment.amount
          });
        })
        .catch(err => {
          this.loading = false;
          this.submitted = false;
          this.cleanup();
          this.appService.toastError(err.message || err);
        });
    } else {
      this.appointmentService.create(this.paymentParams)
        .then(resp => {
          const payment = resp?.data;
          if (!payment?.razorpayOrderId || !payment?.amount || !payment?.transactionId) {
            throw new Error('Payment init failed');
          }
          this.paymentIntent = payment;
          this.loading = false;
          this.openRazorpay({
            transactionId: payment.transactionId,
            razorpayOrderId: payment.razorpayOrderId,
            amount: payment.amount
          });
        })
        .catch(err => {
          this.loading = false;
          this.submitted = false;
          this.cleanup();
          this.appService.toastError(err.message || err);
          this.router.navigate(['/payments/cancel']);
        });
    }
  }

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
        name: this.currentUser?.name || this.currentUser?.username || '',
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

  cleanup(): void {
    this.loading = false;
    this.submitted = false;
    localStorage.removeItem('title');
    localStorage.removeItem('paymentParams');
    localStorage.removeItem('cartInfo');
    this.cartService.removeCart();
  }
}
