import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { ConversationService } from '../conversation.service';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ConverstionsResolver implements Resolve<Observable<any>> {
  constructor(private service: ConversationService) { }

  resolve(): Observable<any> | Promise<any> | any {
    return this.service
      .list({ take: 10000, sort: 'updatedAt', sortType: 'desc' })
      .then(resp => resp.data.items)
      .catch(() => []);
  }
}
