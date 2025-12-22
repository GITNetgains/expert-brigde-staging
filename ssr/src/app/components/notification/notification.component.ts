import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  HostListener
} from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { IUser } from 'src/app/interface';
import { INotification } from 'src/app/interface/notification';
import * as jQuery from 'jquery';
import { AppService } from 'src/app/services';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements AfterViewInit {
  @Input() isShow = false;
  @Input() notifications: INotification[];
  @Input() currentUser: IUser;
  @Output() doRead = new EventEmitter();
  @Output() doRemove = new EventEmitter();
  @Output() closeNotification = new EventEmitter();
  @Output() doReadAllNotification = new EventEmitter();
  public removing = false;
  activeId = '';
  constructor(
    private notificationService: NotificationService,
    private appService: AppService
  ) {}
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
  read(item: INotification, index: number, url = '', param = '') {
    if (item.unreadNotification > 0) {
      this.notificationService.read(item._id).then((resp) => {
        if (resp.data && resp.data.success) {
          this.doRead.emit(this.notifications[index].unreadNotification);
          this.notifications[index].unreadNotification = 0;
        }
      });
    }
    // this.router.navigate(param ? [url, param] : [url]);
  }

  closePopup() {
    this.closeNotification.emit(true);
  }

  removeNotification(item: INotification, index: number) {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      this.removing = true;
      this.notificationService
        .remove(item._id)
        .then((resp) => {
          if (resp.data && resp.data.success) {
            this.appService.toastSuccess('Removed successfully');
            this.notifications.splice(index, 1);
            this.doRemove.emit({ success: true });
            this.removing = false;
          }
        })
        .catch((err) => this.appService.toastError(err));
    }
  }

  readAll() {
    this.notificationService.readAll().then((resp) => {
      if (resp.data && resp.data.success) {
        for (const n of this.notifications) {
          if (n.unreadNotification > 0) {
            n.unreadNotification = 0;
          }
        }
        // this.notifications = this.notifications.map(n =>  {
        //   if (n.unreadNotification > 0) {
        //     n.unreadNotification = 0;
        //   }
        //   return n
        // })
        this.doReadAllNotification.emit(true);
      }
    });
  }

  selectNotificationOption(item: INotification) {
    if (this.activeId && this.activeId === item._id) {
      this.activeId = '';
      return;
    }
    this.activeId = item._id;
  }

  ngAfterViewInit(): void {
    if (this.appService.isBrowser) {
      (function ($) {
        $(document).ready(function () {
          $('.notification-option-dropdown').each(function (this: any) {
            // $(this).css('left', $(this).parent().position().left);
            $(this).css('top', $('.notification-option').height() as number);
            // $(this).css('min-width', $(this).parent().outerWidth());
            // var _this = $(this);
            // $('.notification_scroll').scroll(function () {
            //   $(_this).css('left', $(_this).parent().position().left);
            // });
          });
        });
      })(jQuery);
    }
  }
}
