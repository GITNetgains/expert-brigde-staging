import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { IPayoutAccount } from '../interface';
import { STATE, StateService } from 'src/app/services';
@Component({
  selector: 'app-modal-request-payout',
  templateUrl: './modal-request.html'
})
export class RequestPayoutModalComponent implements OnInit {
  @Input() balance: any;
  accounts: IPayoutAccount[] = [];
  config = {} as any;
  payoutAccountId = '';

  constructor(
    private stateService: StateService,
    public activeModal: NgbActiveModal,
    private router: Router,
    private toast: ToastrService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.config = this.stateService.getState(STATE.CONFIG);
  }

  submitRequest() {
    if (!this.payoutAccountId) {
      return this.toast.error(this.translate.instant('Please enter Payout Account Id'));
    }

    this.activeModal.close({
      payoutAccountId: this.payoutAccountId
    });
  }
}
