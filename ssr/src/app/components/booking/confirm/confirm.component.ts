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

  // Commission & Tax rates — must match Finance Hub PostgreSQL settings
  // TODO: Read these from config service instead of hardcoding
  private readonly MIN_COMMISSION_PERCENT = 0.25;  // 25% minimum platform commission
  private readonly GST_RATE = 0.18;                // 18% GST for Indian clients

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

    const rawCommission =
      tutorRate != null && typeof tutorRate === 'number'
        ? tutorRate
        : (typeof commissionRate === 'number' ? commissionRate : 0);

    // Apply MIN_COMMISSION floor — matches backend Payment.js logic
    const effectiveCommissionRate = Math.max(rawCommission, this.MIN_COMMISSION_PERCENT);

    if (this.price > 0) {
      const clientBase = this.price * (1 + effectiveCommissionRate);
      // Apply GST for Indian clients
      // TODO: Replace isIndianClient=true with this.client?.billingCountry === 'IN'
      // when international payments go live. Currently all clients are Indian (Razorpay only).
      const isIndianClient = true;
      this.totalPrice = Math.round((isIndianClient ? clientBase * (1 + this.GST_RATE) : clientBase) * 100) / 100;
    } else {
      this.totalPrice = this.price;
    }
  }

  confirm() {
    this.activeModal.close({ confirmed: true });
  }
}
