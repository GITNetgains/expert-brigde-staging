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
      return this.appService.toastError('Invalid form, please try again.');
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
    if (this.account.type === 'bank-account' && this.account.paypalAccount) {
      this.account.paypalAccount = '';
    }
    // IBAN numeric validation (frontend-friendly message)
    const ibanVal = this.account.iban !== undefined && this.account.iban !== null
      ? this.account.iban.toString().trim()
      : '';
    if (ibanVal && !/^\d+$/.test(ibanVal)) {
      return this.appService.toastError('IBAN must contain only numbers.');
    }

    this.account._id &&
      this.accountService
        .update(this.account._id, {
          type: this.account.type,
          bankAccountRegion: this.account.bankAccountRegion,
          paypalAccount: this.account.paypalAccount,
          accountHolderName: this.account.accountHolderName,
          accountHolderAddress: this.account.accountHolderAddress,
          accountHolderPostalCode: this.account.accountHolderPostalCode,
          accountNumber: this.account.accountNumber,
          isPersonalAccount: this.account.isPersonalAccount,
          taxIdNumber: this.account.taxIdNumber,
          uniqueIdentificationNumberType: this.account.uniqueIdentificationNumberType,
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
