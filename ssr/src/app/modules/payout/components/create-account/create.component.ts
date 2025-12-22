import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IPayoutAccount } from '../interface';
import { AccountService, AppService, SeoService } from 'src/app/services';
@Component({
  selector: 'app-account-create',
  templateUrl: './form.html'
})
export class AccountCreateComponent implements OnInit {
  public isSubmitted = false;
  public accounts: IPayoutAccount[] = [];
  public account: IPayoutAccount = {
    type: 'bank-account',
    paypalAccount: '',
    accountHolderName: '',
    accountNumber: '',
    iban: '',
    bankName: '',
    bankAddress: '',
    sortCode: '',
    routingNumber: '',
    swiftCode: '',
    ifscCode: '',
    routingCode: ''
  };

  constructor(
    private router: Router,
    private accountService: AccountService,
    private appService: AppService,
    private seoService: SeoService,
    private route: ActivatedRoute
  ) {
    this.seoService.setMetaTitle('Create account');
  }

  ngOnInit() {
    this.accounts = this.route.snapshot.data['account'];
  }

  submit(frm: any) {
    this.isSubmitted = true;
    if (frm.invalid) {
      return this.appService.toastError('Form is invalid, please try again.');
    }
    if (
      this.account.type === 'paypal' &&
      this.account.paypalAccount?.trim() === ''
    ) {
      return this.appService.toastError(
        'If you select type payout is paypal, please enter Paypal Account'
      );
    }

    this.accountService.create(this.account).then(
      () => {
        this.appService.toastSuccess('Account has been created');
        this.router.navigate(['/users/payout/account']);
      },
      (err) => this.appService.toastError(err)
    );
  }
}
