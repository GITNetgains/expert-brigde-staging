import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { IUser } from 'src/app/interface';
import { AuthService, CartService, STATE, StateService, SystemService } from 'src/app/services';
import { NotificationService } from 'src/app/services';
import { CartComponent } from '../user/cart/cart.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
   drawerOpen = false;

  toggleDrawer() {
    this.drawerOpen = !this.drawerOpen;
  }
  public currentUser: IUser | undefined;
  public appConfig: any;
  public isHome = false;
  public isOpenedMenu = false;
  public userLang: any;
  public languages: any = [];
  public flag: any = '/assets/images/flags/en.svg';
  public isLoaded: any = false;
  public showHelloBar = true;
  public notificationOptions = {
    filter: {
      page: 1,
      take: 1000,
      sort: 'updatedAt',
      sortType: 'desc'
    },
    count: 0,
    unreadNotification: 0,
    notifications: []
  };

  public isShow = false;
  cartCount = 0;
  constructor(
    private stateService: StateService,
    private authService: AuthService,
    private systemService: SystemService,
    private translate: TranslateService,
    private cartService: CartService,
    private notificationService: NotificationService,
    private modalService: NgbModal,
    private router: Router
  ) {
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
    this.authService.currentUserSubject.subscribe((u) => {
      this.currentUser = u || undefined;
    });
    // this.appConfig = this.stateService.getState(STATE.CONFIG);
    // this.showHelloBar = this.appConfig.helloBar.isActive;
    // if (Object.keys(this.appConfig).length > 0) {
    //   this.isLoaded = true;
    //   this.languages = this.appConfig.i18n.languages;
    //   this.userLang = this.appConfig.userLang;
    //   this.languages.map((item: any) => {
    //     if (item.key === this.userLang) this.flag = item.flag;
    //   });
    // }

    //navjot 
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);

// SAFE fallback
this.appConfig = this.stateService.getState(STATE.CONFIG) || {};

// Prevents error: Cannot read properties of undefined (reading 'isActive')
this.showHelloBar = this.appConfig?.helloBar?.isActive ?? false;

// Load languages only if config exists
if (this.appConfig?.i18n?.languages?.length) {
  this.isLoaded = true;
  this.languages = this.appConfig.i18n.languages;
  this.userLang = this.appConfig.userLang;

  this.languages.map((item: any) => {
    if (item.key === this.userLang) this.flag = item.flag;
  });
}

    if (this.currentUser && this.currentUser._id) {
      this.cartService.model.data$.subscribe(resp => {
        const { items } = resp;
        this.cartCount = items.length;
      });
    }
  }

  ngOnInit(): void {
    if (this.currentUser && this.currentUser._id) {
      this.getNotification();
    }
  }

  logout() {
    this.authService.removeToken();
    // this.router.navigate(['/auth/login']);
    localStorage.removeItem('cartInfo');
    window.location.href = '/';
  }

  changeLang(lang: any) {
    this.flag = lang.flag;

    this.userLang = lang.key;
    this.systemService.setUserLang(this.userLang);
    this.translate.use(this.userLang);
  }

  // login() {
  // }

  getNotification() {
    this.notificationService.list(this.notificationOptions.filter).then(resp => {
      if (resp && resp.data && resp.data.items && resp.data.items.length) {
        this.notificationOptions.notifications = resp.data.items;
        this.notificationOptions.count = resp.data.count;
        this.notificationOptions.unreadNotification = resp.data.unreadNotification;
      }
    });
  }

  showNotification() {
    this.isShow = !this.isShow;
  }

  onReadNotification(unreadNotification: number) {
    this.notificationOptions.unreadNotification -= unreadNotification;
    this.isShow = false;
  }

  onRemoveNotification(event: any) {
    if (event.success) {
      this.getNotification();
    }
  }

  onReadAllNotification() {
    this.notificationOptions.unreadNotification = 0;
    this.isShow = false;
  }

  checkout() {
    const modalRef = this.modalService.open(CartComponent, {
      centered: true,
      size: 'lg'
    });
    modalRef.result.then(
      res => {
        console.log(res);
      },
      () => { return }
    );
  }

 openAuth(type: 'tutor' | 'student') {
  const urlType = type === 'tutor' ? 'expert' : 'client';

  this.router.navigate(['/auth/sign-up'], {
    queryParams: { type: urlType }
  });
}

}
