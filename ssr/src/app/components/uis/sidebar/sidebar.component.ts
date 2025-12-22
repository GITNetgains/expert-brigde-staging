import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { IUser } from 'src/app/interface';
import { AuthService, CartService, STATE, StateService, SystemService } from 'src/app/services';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  public tree: any = [];
  public currentUser: IUser;
  @Input() showMenu = true;
  @Output() showMenuChange = new EventEmitter<boolean>();
  public config: any;
  public userLang: any;
  public languages: any = [];
  flag = '';
  cartCount = 0;
  showBooking = false;
  unreadNotificationCount = 0;
  constructor(
    private authService: AuthService,
    private readonly systemService: SystemService,
    private translate: TranslateService,
    public stateService: StateService,
    private modalService: NgbModal,
    private cartService: CartService,
    private notificationService: NotificationService
  ) {
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
    if (this.currentUser) {
      this.notificationService.countUnread().then(resp => (this.unreadNotificationCount = resp.data.count || 0));
    }

    this.authService.userLoaded$.subscribe(() => {
      this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
      if (this.currentUser) {
        this.notificationService
          .countUnread()
          .then(resp => (this.unreadNotificationCount = resp.data.count || 0))
          .catch(() => (this.unreadNotificationCount = 0));
      }
    });

    this.config = this.stateService.getState(STATE.CONFIG);
    this.languages = this.config.i18n.languages;
    this.userLang = this.config.userLang;
    this.cartService.model.data$.subscribe(resp => {
      const { items } = resp;
      this.cartCount = items.length;
    });
    this.showBooking = this.stateService.showBooking();
  }
  logout() {
    this.authService.removeToken();
    window.location.href = '/';
  }

  toggleMemu() {
    this.showMenuChange.emit(!this.showMenu);
  }

  changeLang(lang: any) {
    this.userLang = lang.key;
    this.systemService.setUserLang(this.userLang);
    this.translate.use(this.userLang);
  }
}
