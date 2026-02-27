import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, map, mergeMap, tap } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { IUser } from 'src/app/interface';
import { AuthService, CartService, ConversationService, STATE, StateService, SystemService } from 'src/app/services';
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
  unreadMessageCount = 0;
  cartCount = 0;
  public languages: any = [];
  private onReadNotificationSubscription: Subscription;
  private onUnreadMessageSubscription: Subscription;
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
    private translate: TranslateService,
    private conversationService: ConversationService
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

      this.conversationService
        .list({ page: 1, take: 100, sort: 'updatedAt', sortType: 'desc' })
        .then(resp => {
          const items = resp?.data?.items || [];
          this.unreadMessageCount = items.reduce(
            (sum: number, conv: any) => sum + (conv.userMeta?.unreadMessage || 0),
            0
          );
        })
        .catch(() => {
          this.unreadMessageCount = 0;
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
    });

    this.onUnreadMessageSubscription = this.conversationService.unreadChanged$.subscribe(total => {
      this.unreadMessageCount = total >= 0 ? total : 0;
    });
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
    if (this.onReadNotificationSubscription) {
      this.onReadNotificationSubscription.unsubscribe();
    }
    if (this.onUnreadMessageSubscription) {
      this.onUnreadMessageSubscription.unsubscribe();
    }
  }
}
