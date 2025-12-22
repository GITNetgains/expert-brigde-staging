import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IToast } from '../interfaces';
import { ToasterPlacement } from '@coreui/angular';

@Injectable({
  providedIn: 'root',
})
export class UtilService {
  private toastSubject = new BehaviorSubject<{
    open: boolean;
    options: IToast | null;
  } | null>(null);
  toastValues$: Observable<{
    open: boolean;
    options: IToast | null;
  } | null> = this.toastSubject.asObservable();
  constructor() {}

  addToast(options: IToast) {
    this.toastSubject.next({
      open: true,
      options,
    });
  }

  toastSuccess(options: IToast) {
    this.toastSubject.next({
      open: true,
      options: {
        title: options?.title || '',
        color: 'success',
        message: options?.message,
        delay: options.delay || 3000,
        autohide: options?.autohide || true,
        placement: options?.placement || ToasterPlacement.BottomEnd,
      },
    });
  }

  toastWarning(options: IToast) {
    this.toastSubject.next({
      open: true,
      options: {
        title: options?.title || '',
        color: 'warning',
        message: options?.message,
        delay: options.delay || 3000,
        autohide: options?.autohide || true,
        placement: options?.placement || ToasterPlacement.BottomEnd,
      },
    });
  }

  toastError(options: IToast) {
    this.toastSubject.next({
      open: true,
      options: {
        title: options?.title || '',
        color: 'danger',
        message: options?.message,
        delay: options.delay || 3000,
        autohide: options?.autohide || true,
        placement: options?.placement || ToasterPlacement.BottomEnd,
      },
    });
  }

  toastInfo(options: IToast) {
    this.toastSubject.next({
      open: true,
      options: {
        title: options?.title || '',
        color: 'info',
        message: options?.message,
        delay: options.delay || 3000,
        autohide: options?.autohide || true,
        placement: options?.placement || ToasterPlacement.BottomEnd,
      },
    });
  }

  closeToast() {
    const options = {
      open: false,
      options: null,
    };
    this.toastSubject.next(options);
  }
}
