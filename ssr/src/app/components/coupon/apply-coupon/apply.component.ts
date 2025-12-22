import { Component, Input, EventEmitter, Output } from '@angular/core';
import { AppService, AuthService, CouponService } from 'src/app/services';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-apply-coupon',
  templateUrl: './apply.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ApplyCouponComponent {
  @Input() options: any = {
    targetId: '',
    tutorId: '',
    targetType: ''
  };
  @Output() doApply = new EventEmitter();
  @Output() isUsed = new EventEmitter();
  public usedCoupon = false;
  public couponCode = '';
  public appliedCoupon = false;
  @Output() doCancel = new EventEmitter();
  constructor(
    private couponService: CouponService,
    private appService: AppService,
    private authService: AuthService
  ) {}

  applyCoupon() {
    if (!this.authService.isLoggedin()) {
      return this.appService.toastError('Please login to use the coupon!');
    }
    if (!this.couponCode) {
      return this.appService.toastError('Please enter coupon code!');
    }
    this.couponService
      .applyCoupon({
        code: this.couponCode || '',
        targetType: this.options.targetType,
        targetId: this.options.targetId || '',
        tutorId: this.options.tutorId || ''
      })
      .then((resp: any) => {
        if (resp.data && resp.data.canApply) {
          this.appliedCoupon = true;
          return this.doApply.emit({
            appliedCoupon: this.appliedCoupon,
            coupon: resp.data.coupon
          });
        }
        this.appService.toastError('Can not apply this coupon code!');
      })
      .catch((err: any) => {
        this.cancel();
        this.appService.toastError(err);
      });
  }

  cancel() {
    this.appliedCoupon = false;
    this.couponCode = '';
    return this.doCancel.emit({ cancelled: true });
  }
}
