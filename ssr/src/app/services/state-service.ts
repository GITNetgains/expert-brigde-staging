import { Injectable } from '@angular/core';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { IUser } from '../interface';

export const STATE = {
  CONFIG: 'config',
  CURRENT_USER: 'currentUser'
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  constructor(private transferState: TransferState) { }
  saveState<T>(key: string, data: any): void {
    this.transferState.set<T>(makeStateKey(key), data);
  }

  getState<T>(key: string, defaultValue: any = null): T {
    const state = this.transferState.get<T>(makeStateKey(key), defaultValue);
    // this.transferState.remove(makeStateKey(key));
    return state;
  }

  hasState<T>(key: string): boolean {
    return this.transferState.hasKey<T>(makeStateKey(key));
  }

  removeState<T>(key: string): any {
    return this.transferState.remove(makeStateKey(key));
  }

  showBooking(): boolean {
    const current = this.getState(STATE.CURRENT_USER) as IUser;
    if (!current || (current && current.type === 'student')) return true;
    const config = this.getState(STATE.CONFIG) as any;
    return current && current.type === 'tutor' && config.allowTutorBooking ? true : false;
  }
}
