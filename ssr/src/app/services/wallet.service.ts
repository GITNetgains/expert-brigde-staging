import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({ providedIn: 'root' })
export class WalletService extends APIRequest {

  getBalance(): Promise<any> {
    return this.get('/credit/wallet/balance');
  }

  getHistory(): Promise<any> {
    return this.get('/credit/wallet/history');
  }


  getCreditNotes(): Promise<any> {
    return this.get('/credit/my-credit-notes');
  }

  applyCredit(data: { booking_id: string; amount_minor: number; user_id: string }): Promise<any> {
    return this.post('/credit/wallet/apply', data);
  }

  formatAmount(amountMinor: number): string {
    var inr = Math.abs(amountMinor) / 100;
    return '\u20B9' + inr.toLocaleString('en-IN');
  }
}
