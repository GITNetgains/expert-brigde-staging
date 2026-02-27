import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';
import { IMylesson, ISubject, IUser } from 'src/app/interface';
@Component({
  selector: 'app-stripe',
  templateUrl: './confirm.html'
})
export class ConfirmModalComponent {
  @Input() subject: ISubject;
  @Input() tutor: IUser;
  @Input() slot: IMylesson;
  @Input() price = 0;
  @Input() config: any;
  @Input() appliedCoupon = false;

  // Computed totals (student sees only total)
  public totalPrice = 0;

  constructor(
    public activeModal: NgbActiveModal,
    private toasty: ToastrService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Mirror backend Payment.js commission selection:
    // prefer tutor.commissionRate, else global config.commissionRate
    let commissionRate: any =
      this.config && typeof this.config.commissionRate !== 'undefined'
        ? this.config.commissionRate
        : 0;
    if (typeof commissionRate === 'string') {
      commissionRate = parseFloat(commissionRate);
    }

    const tutorRate =
      this.tutor && typeof (this.tutor as any).commissionRate === 'number'
        ? (this.tutor as any).commissionRate
        : null;

    const effectiveCommissionRate =
      tutorRate != null && typeof tutorRate === 'number'
        ? tutorRate
        : (typeof commissionRate === 'number' ? commissionRate : 0);

    this.totalPrice =
      this.price > 0
        ? Math.round(this.price * (1 + effectiveCommissionRate) * 100) / 100
        : this.price;
  }

  confirm() {
    this.activeModal.close({ confirmed: true });
  }
}
