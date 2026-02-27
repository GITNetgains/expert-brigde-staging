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
    bankAccountRegion: '',
    paypalAccount: '',
    accountHolderName: '',
    accountHolderAddress: '',
    accountHolderPostalCode: '',
    accountNumber: '',
    isPersonalAccount: false,
    taxIdNumber: '',
    uniqueIdentificationNumberType: '',
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
    if (this.account.type === 'paypal') {
      if (this.account.paypalAccount?.trim() === '') {
        return this.appService.toastError(
          'If you select type payout is paypal, please enter Paypal Account'
        );
      }
      // Clear bank-specific region when using PayPal to avoid backend enum validation issues
      (this.account as any).bankAccountRegion = undefined;
    }
    if (this.account.type === 'bank-account') {
      if (!this.account.bankAccountRegion?.trim()) {
        return this.appService.toastError('Please select bank account country / region.');
      }
      const r = this.account.bankAccountRegion;
      if (r === 'uk' && !this.account.sortCode?.trim()) {
        return this.appService.toastError('Please enter UK Bank Code (SORT Code).');
      }
      if (r === 'india' && !this.account.ifscCode?.trim()) {
        return this.appService.toastError('Please enter IFSC Code for India.');
      }
      if (r === 'us' && !this.account.routingNumber?.trim()) {
        return this.appService.toastError('Please enter ABA Routing Number for US.');
      }
    }

    // IBAN numeric validation (frontend-friendly message)
    const ibanVal = this.account.iban !== undefined && this.account.iban !== null
      ? this.account.iban.toString().trim()
      : '';
    if (ibanVal && !/^\d+$/.test(ibanVal)) {
      return this.appService.toastError('IBAN must contain only numbers.');
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
