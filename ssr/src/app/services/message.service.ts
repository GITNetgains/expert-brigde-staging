import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class MessageService extends APIRequest {
  private sendMessage = new Subject<any>();
  public sendMessage$ = this.sendMessage.asObservable();

  listByConversation(conversationId: string, params: any): Promise<any> {
    return this.get(this.buildUrl(`/messages/conversations/${conversationId}`, params));
  }

  send(data: any) {
    return this.post('/messages', data);
  }

  afterSendSuccess(conversationId: string, message: string) {
    this.sendMessage.next({
      conversationId,
      message
    });
  }
}
