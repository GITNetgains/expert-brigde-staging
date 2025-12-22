import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { IUser } from 'src/app/interface';
import { CartItem, CartService, STATE, StateService, TutorService } from 'src/app/services';
@Component({
  selector: 'app-cart',
  templateUrl: './cart.html',
  styleUrls: ['./card.component.scss']
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  config = {} as any;
  totalPrice = 0;
  tutor: IUser;
  loading = false;
  constructor(
    private cartService: CartService,
    private stateService: StateService,
    public activeModal: NgbActiveModal,
    private router: Router,
    private tutorService: TutorService,
    private toast: ToastrService
  ) {
    this.cartService.model.data$.subscribe(resp => {
      this.cartItems = resp.items;
      let price = 0;
      if (this.cartItems.length > 0) {
        this.cartItems.forEach(item => (price += item.price));
      }
      this.totalPrice = price;
    });
  }

  ngOnInit(): void {
    this.config = this.stateService.getState(STATE.CONFIG)
    const tutorInCart = this.cartService.getTutorId();
    this.loading = true;
    this.tutorService.findOne(tutorInCart).then(resp => {
      this.tutor = resp.data;
      this.loading = false;
    });
    console.log('cartItems:', this.cartItems);
  }

  removeItem(item: any) {
    this.cartService.removeItem(item);
  }

  checkout() {
    if (!this.tutor) return this.toast.error('Loading data, please wait...');
    this.activeModal.close({
      checkout: true
    });
    const paymentParams = {
      tutorId: this.cartService.getTutorId(),
      times: this.cartItems.map(item => {
        return {
          startTime: item.product.startTime,
          toTime: item.product.toTime,
          targetId: item.product.targetId,
          couponCode: item.couponCode
        };
      })
    };
    localStorage.setItem('paymentParams', JSON.stringify(paymentParams));

    return this.router.navigate(['/payments/pay'], {
      queryParams: {
        type: 'booking',
        targetType: 'subject',
        title: `Make your Payment for classes with tutor ${this.tutor.name}`
      },
      state: paymentParams
    });
  }
}

