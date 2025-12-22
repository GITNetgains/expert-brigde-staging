import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { IPayoutAccount, IPayoutRequest } from '../interface';
import {
  AppService,
  AuthService,
  RequestPayoutService,
  STATE,
  SeoService,
  StateService
} from 'src/app/services';
@Component({
  selector: 'app-create-request-payout',
  templateUrl: './form.html'
})
export class CreateRequestPayoutComponent implements OnInit {
  public balance: IPayoutRequest;
  public payoutAccountId: any = '';
  public accounts: IPayoutAccount[] = [];
  public tutorId: any;
  public config: any;
  @Output() doRequest = new EventEmitter();

  constructor(
    private router: Router,
    private payoutService: RequestPayoutService,
    private appService: AppService,
    private seoService: SeoService,
    private authService: AuthService,
    public stateService: StateService
  ) {
    this.seoService.setMetaTitle('Send request');
    this.config = this.stateService.getState(STATE.CONFIG);
  }

  ngOnInit() {
    this.authService.getCurrentUser().then((resp) => {
      this.tutorId = resp.id;

      this.getBalance({ tutorId: this.tutorId });
    });

    this.payoutService
      .findAccount({
        take: 50,
        sortBy: 'createdAt',
        sortType: 'desc'
      })
      .then((res) => {
        this.accounts = res.data.items;
        this.payoutAccountId = this.accounts[0]._id;
      })
      .catch(() => this.appService.toastError());
  }

  getBalance(params: any) {
    this.payoutService
      .getBalance(params)
      .then((resp) => {
        this.balance = resp.data;
      })
      .catch(() => this.appService.toastError());
  }
  submit() {
    if (!this.payoutAccountId) {
      return this.appService.toastError('Please enter Payout Account Id');
    }
    this.payoutService
      .create({ payoutAccountId: this.payoutAccountId })
      .then((res) => {
        this.doRequest.emit(res.data);
        this.appService.toastSuccess('Your request has been sent.');
        this.router.navigate(['/users/payout/request']);
      })
      .catch((err) => {
        this.appService.toastError(err);
      });
  }
}
