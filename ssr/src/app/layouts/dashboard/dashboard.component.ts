import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, map, mergeMap, tap } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { IUser } from 'src/app/interface';
import { AuthService, CartService, STATE, StateService, SystemService } from 'src/app/services';
import { NotificationService } from 'src/app/services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { CartComponent } from 'src/app/components/user/cart/cart.component';
@Component({
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  public noShowMenu = false;
  showSidebar = true;
  mobileScreenWidth = 768;
  public config: any;
  public userLang: any;
  public currentUser: IUser;
  unreadNotificationCount = 0;
  cartCount = 0;
  public languages: any = [];
  private onReadNotificationSubscription: Subscription;
  public flag: any = '/assets/images/flags/en.svg';
  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private stateService: StateService,
    private authService: AuthService,
    private cartService: CartService,
    private modalService: NgbModal,
    private notificationService: NotificationService,
    private systemService: SystemService,
    private translate: TranslateService
  ) {
    this.config = this.stateService.getState(STATE.CONFIG);
    this.languages = this.config.i18n.languages;
    this.userLang = this.config.userLang;
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
    if (this.currentUser) {
      this.notificationService.countUnread().then(resp => (this.unreadNotificationCount = resp.data.count || 0));

      this.cartService.model.data$.subscribe(resp => {
        const { items } = resp;
        this.cartCount = items.length;
      });
    }

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.route),
        map((activatedRoute: any) => {
          while (activatedRoute.firstChild) activatedRoute = activatedRoute.firstChild;
          return route;
        }),
        mergeMap(mergedRoute => {
          return mergedRoute.data;
        }),
        tap(paramMap => paramMap)
      )
      .subscribe(
        paramAsMap => {
          this.noShowMenu = paramAsMap['noShowMenu'] ? true : false;
        }
        // Get the params (paramAsMap.params) and use them to highlight or everything that meet your need
      );
  }

  ngOnInit() {
    this.onReadNotificationSubscription = this.notificationService.readNotification$.subscribe(value => {
      if (value > 0 && this.unreadNotificationCount >= value) {
        this.unreadNotificationCount -= value;
      }
    })
    if (window.innerWidth <= this.mobileScreenWidth) this.showSidebar = false;
  }
  logout() {
    this.authService.removeToken();
    window.location.href = '/';
  }
  showMenuChange(data: any) {
    this.showSidebar = data;
  }

  toggleMemu() {
    this.showSidebar = !this.showSidebar;
  }
  checkout() {
    const modalRef = this.modalService.open(CartComponent, {
      centered: true,
      size: 'lg'
    });
    modalRef.result.then(
      res => {
        console.log(res);
      }, () => { return }
    );
  }

  changeLang(lang: any) {
    this.flag = lang.flag;

    this.userLang = lang.key;
    this.systemService.setUserLang(this.userLang);
    this.translate.use(this.userLang);
  }

  ngOnDestroy(): void {
    this.onReadNotificationSubscription.unsubscribe();
  }
}
