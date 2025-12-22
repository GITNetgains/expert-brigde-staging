import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { APIRequest } from './api-request';

@Injectable({
  providedIn: 'root'
})
export class CalendarService extends APIRequest {
  private scheduleLoaded = new Subject<any>();
  public scheduleLoaded$ = this.scheduleLoaded.asObservable();

  async search(params: any): Promise<any> {
    return this.get(this.buildUrl('/schedule', params));
  }

  async create(data: any): Promise<any> {
    return this.post('/schedule', data);
  }

  async update(id: string, data: any): Promise<any> {
    return this.put(`/schedule/${id}`, data);
  }

  async delete(id: string): Promise<any> {
    return this.del(`/schedule/${id}`);
  }

  async deleteByHash(hash: string): Promise<any> {
    return this.del(`/schedule/remove-by-hash/${hash}`);
  }

  async checkByHash(hash: string): Promise<any> {
    return this.post(`/schedule/check-by-hash/${hash}`);
  }

  async checkByWebinar(webinarId: string): Promise<any> {
    return this.post(`/schedule/check-by-webinar/${webinarId}`);
  }

  async createRecurring(data: any): Promise<any> {
    return this.post('/recurring-schedule', data);
  }

  async loadListRecurring(query: any): Promise<any> {
    return this.get(this.buildUrl('/recurring-schedule', query));
  }

  async removeRecurring(id: string): Promise<any> {
    return this.del(`/recurring-schedule/${id}`);
  }

  async all(params: any) {
    return this.get(this.buildUrl('/schedule', params));
  }
}
