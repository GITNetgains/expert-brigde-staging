import { Injectable } from '@angular/core';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class UserService extends APIRequest {
  me(): Promise<any> {
    return this.get('/users/me');
  }

  updateMe(data: any): Promise<any> {
    return this.put('/users', data);
  }

  findOne(id: string): Promise<any> {
    return this.get(`/users/${id}`);
  }

  inviteFriend(params: any): Promise<any> {
    return this.post('/newsletter/invite-friend', params);
  }

  deleteAvatar(): Promise<any> {
    return this.del('/users/avatar/delete');
  }

  changeEmail(id: string, data: any): Promise<any> {
    return this.put(`/users/${id}/change-email`, data);
  }
}
