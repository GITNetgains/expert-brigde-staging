import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class ConversationService extends APIRequest {
  private conversationLoaded = new Subject<any>();
  public conversationLoaded$ = this.conversationLoaded.asObservable();

  list(params: any): Promise<any> {
    return this.get(this.buildUrl('/messages/conversations', params));
  }

  create(recipientId: string): Promise<any> {
    return this.post('/messages/conversations', { recipientId });
  }

  setActive(conversation: any) {
    this.conversationLoaded.next(conversation);
  }

  read(conversationId: string, params: any): Promise<any> {
    return this.post(`/messages/conversations/${conversationId}/read`, params);
  }

  findOne(id: string): Promise<any> {
    return this.get(`/messages/conversation/${id}`);
  }
}
