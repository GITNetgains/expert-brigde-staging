import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IPayoutAccount } from '../interface';
import { AccountService, AppService, SeoService } from 'src/app/services';
@Component({
  selector: 'app-account-update',
  templateUrl: '../create-account/form.html'
})
export class AccountUpdateComponent implements OnInit {
  public isSubmitted = false;
  public account: IPayoutAccount;

  constructor(
    private accountService: AccountService,
    private route: ActivatedRoute,
    private appService: AppService,
    private seoService: SeoService
  ) {
    this.seoService.setMetaTitle('Update payout account');
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') as string;

    this.accountService.findOne(id).then((resp) => {
      this.account = resp.data;
    });
  }

  submit(frm: any) {
    this.isSubmitted = true;
    if (frm.$invalid) {
      this.appService.toastError('Invalid form, please try again.');
    }

    if (
      this.account.type === 'paypal' &&
      this.account.paypalAccount?.trim() === ''
    ) {
      return this.appService.toastError(
        'If you select type payout is paypal, please enter Paypal Account'
      );
    } else if (
      this.account.type === 'bank-account' &&
      this.account.paypalAccount
    ) {
      this.account.paypalAccount = '';
    }
    this.account._id &&
      this.accountService
        .update(this.account._id, {
          type: this.account.type,
          paypalAccount: this.account.paypalAccount,
          accountHolderName: this.account.accountHolderName,
          accountNumber: this.account.accountNumber,
          iban: this.account.iban,
          bankName: this.account.bankName,
          bankAddress: this.account.bankAddress,
          sortCode: this.account.sortCode,
          routingNumber: this.account.routingNumber,
          swiftCode: this.account.swiftCode,
          ifscCode: this.account.ifscCode,
          routingCode: this.account.routingCode
        })
        .then(() => {
          this.appService.toastSuccess('Updated successfully.');
        });
  }
}
