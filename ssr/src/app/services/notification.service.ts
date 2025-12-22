import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class NotificationService extends APIRequest {
  private readNotification = new Subject<any>();
  public readNotification$ = this.readNotification.asObservable()

  list(params: any): Promise<any> {
    return this.get(this.buildUrl('/notifications', params));
  }

  read(notificationId: string): Promise<any> {
    return this.post(`/notification/read/${notificationId}`);
  }

  remove(notificationId: string): Promise<any> {
    return this.del(`/notification/remove/${notificationId}`);
  }

  readAll(): Promise<any> {
    return this.post('/notification/read-all');
  }

  countUnread(): Promise<any> {
    return this.get('/notifications/count-unread');
  }

  onReadNotificationSuccess(value: number) {
    this.readNotification.next(value);
  }
}
