import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as moment from 'moment';
import { SsrCookieService } from 'ngx-cookie-service-ssr';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cookieService = inject(SsrCookieService);

  // Initial state
  private initialState: State = {
    tutorId: '',
    items: []
  };

  // BehaviorSubject replaces Model<State>
  private stateSubject = new BehaviorSubject<State>(this.initialState);

  // This matches the old this.model.data$
  public cart$: Observable<State> = this.stateSubject.asObservable();

  // For backward compatibility (model.get(), model.set(), model.data$)
  public model = {
    get: (): State => this.stateSubject.getValue(),
    set: (newState: State): void => this.stateSubject.next(newState),
    data$: this.cart$
  };

  constructor() {
    // Load from cookies if exists
    const saved = this.cookieService.get('cartInfo');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.stateSubject.next(parsed);
      } catch (err) {
        console.error('Invalid cart cookie JSON');
      }
    }
  }

  getCart() {
    return this.model.get();
  }

  getTutorId() {
    return this.model.get().tutorId;
  }

  getItemsInCart(type = '') {
    const items = this.model.get().items;
    return type ? items.filter((item: any) => item.type === type) : items;
  }

  updateTutorId(tutorId: string) {
    const model = this.model.get();
    const newModel = { ...model, tutorId };
    this.cookieService.set('cartInfo', JSON.stringify(newModel));
    this.model.set(newModel);
  }

  updateCart(item: CartItem) {
    const model = this.model.get();
    const newModel = {
      ...model,
      items: [...model.items, item]
    };
    this.cookieService.set('cartInfo', JSON.stringify(newModel));
    this.model.set(newModel);
  }

  updateCartInfoFromLocal(cart: State) {
    const model = this.model.get();
    const newModel = { ...model, ...cart };
    this.model.set(newModel);
  }

  removeItem(item: CartItem) {
    const model = this.model.get();
    const newItems = model.items.filter((i: any) =>
      !moment(i.product.startTime).isSame(item.product.startTime)
    );

    const newModel = { ...model, items: newItems };
    this.cookieService.set('cartInfo', JSON.stringify(newModel));
    this.model.set(newModel);
  }

  removeCart() {
    const model = this.model.get();
    const newModel = { ...model, items: [] };
    this.model.set(newModel);
  }
}

export interface CartItem {
  product: { [key: string]: any };
  price: number;
  quantity: number;
  type: string;
  couponCode: string;
  originalPrice: number;
}

export interface State {
  tutorId: string;
  items: CartItem[];
}
