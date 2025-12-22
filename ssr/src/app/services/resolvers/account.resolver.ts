import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { AccountService } from '../payout-account.service';


@Injectable({
  providedIn: 'root'
})
export class AccountResolver implements Resolve<Observable<any>> {
  constructor(private accountService: AccountService) { }

  resolve(): any {
    return this.accountService.find({ take: 100 }).then((resp: any) => resp.data && resp.data.items);
  }
}
