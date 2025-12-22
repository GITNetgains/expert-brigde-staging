import { Injectable } from '@angular/core';
import { currencies } from '@components/shared/data/currency';
@Injectable({
  providedIn: 'root',
})
export class CurrenciesService {
  constructor() {}

  getCurrencies() {
    return currencies;
  }
}
