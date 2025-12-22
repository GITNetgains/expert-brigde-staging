import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AppService,
  RequestRefundService,
  STATE,
  StateService,
  TransactionService
} from 'src/app/services';
import { ITransaction, IUser } from 'src/app/interface';
@Component({
  selector: 'app-detail-appointment',
  templateUrl: './detail.html'
})
export class AppointmentDetailComponent implements OnInit {
  public transaction: ITransaction = {};
  public options: any = {
    transactionId: '',
    type: 'appointment',
    tutorId: '',
    userId: ''
  };
  private aId: any;
  public type: any;
  public submitted = false;
  public reason = '';
  public config: any;
  public currentUser: IUser;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appService: AppService,
    private transactionService: TransactionService,
    private refundService: RequestRefundService,
    private location: Location,
    public stateService: StateService
  ) {
    this.config = this.stateService.getState(STATE.CONFIG);
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
  }

  ngOnInit() {
    this.aId = this.route.snapshot.paramMap.get('id');
    this.type = this.currentUser.type;
    this.findOne();
  }
  findOne() {
    this.transactionService.findOne(this.aId).then((resp) => {
      this.transaction = resp.data;
      this.options.transactionId = this.transaction._id;
      this.options.tutorId =
        this.transaction.tutor && this.transaction.tutor._id;
      this.options.userId = this.transaction.user && this.transaction.user._id;
    });
  }

  cancelEvent(info: any) {
    if (!info && info.status !== 'canceled') {
      return this.appService.toastError();
    }
    this.transaction.status = 'canceled';
  }

  request(type?: string) {
    this.submitted = true;
    if (this.reason.trim() === '') {
      return this.appService.toastError('Please enter reason');
    }
    if (!this.currentUser.paypalEmailId) {
      this.appService.toastError(
        'Please update your paypal email Id before send refund request'
      );
      return this.router.navigate(['/users/profile']);
    }
    this.refundService
      .create({
        transactionId: this.transaction._id,
        reason: this.reason,
        type,
        targetType: this.transaction.targetType
      })
      .then(() => {
        this.location.back();
        this.appService.toastSuccess('Request successfully!');
      })
      .catch((e) => this.appService.toastError(e));
  }
}
