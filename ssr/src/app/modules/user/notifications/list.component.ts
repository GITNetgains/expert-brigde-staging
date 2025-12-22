import { Component, HostListener, OnInit } from '@angular/core';
import { IUser } from 'src/app/interface';
import { INotification } from 'src/app/interface/notification';
import {
  AppService,
  NotificationService,
  STATE,
  SeoService,
  StateService
} from 'src/app/services';
declare let $: any;

@Component({
  templateUrl: 'list.html'
})
export class ListNotificationComponent implements OnInit {
  public page = 1;
  public pageSize = 10;
  public items: INotification[] = [];
  public total = 0;
  public sortOption = {
    sortBy: 'createdAt',
    sortType: 'desc'
  };
  public loading = false;
  activeId = '';
  public currentUser: IUser;
  constructor(
    private seoService: SeoService,
    private notificationService: NotificationService,
    private appService: AppService,
    private stateService: StateService
  ) {
    this.seoService.setMetaTitle('Notifications');
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
  }

  @HostListener('click', ['$event.target'])
  onClick(btn: HTMLElement) {
    const { parentElement } = btn;
    if (
      !parentElement ||
      !parentElement.className ||
      (parentElement.className &&
        parentElement.className.indexOf('notification-option') < 0)
    ) {
      this.activeId = '';
    }
  }

  ngOnInit() {
    this.query();
  }
  query() {
    this.loading = true;
    this.notificationService
      .list({
        page: this.page,
        take: this.pageSize,
        sort: 'updatedAt',
        sortType: 'desc'
      })
      .then((resp) => {
        this.items = resp.data.items;
        this.total = resp.data.count;
      });
  }
  pageChange() {
    $('html, body').animate({ scrollTop: 0 });
    this.query();
  }

  selectNotificationOption(item: INotification) {
    if (this.activeId && this.activeId === item._id) {
      this.activeId = '';
      return;
    }
    this.activeId = item._id;
  }

  read(item: INotification, index: number, url = '', param = '') {
    if (item.unreadNotification > 0) {
      this.notificationService.read(item._id).then((resp) => {
        if (resp.data && resp.data.success) {
          this.items[index].unreadNotification = 0;
          this.notificationService.onReadNotificationSuccess(1);
        }
      });
    }
    // this.router.navigate(param ? [url, param] : [url]);
  }

  removeNotification(item: INotification, index: number) {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      this.notificationService
        .remove(item._id)
        .then((resp) => {
          if (resp.data && resp.data.success) {
            this.appService.toastSuccess('Removed successfully');
            this.items.splice(index, 1);
          }
        })
        .catch((err) => this.appService.toastError(err));
    }
  }
}
