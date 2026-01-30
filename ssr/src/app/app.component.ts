import { Component, OnInit, HostBinding, Inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { CartService, STATE, StateService } from './services';
import { TranslateService } from '@ngx-translate/core';
import { IUser } from './interface';
import { SsrCookieService } from 'ngx-cookie-service-ssr';
import * as jQuery from 'jquery';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'angular-bootstrap';
  footerUrl = 'https://www.ganatan.com/';
  footerLink = 'www.ganatan.com';
  config: any;
  currentUser!: IUser;

  @HostBinding('class.no-padding') isAuthPage = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private stateService: StateService,
    private translate: TranslateService,
    private cartService: CartService,
    private router: Router,
    private cookieService: SsrCookieService
  ) {
    this.config = this.stateService.getState(STATE.CONFIG);
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);

    const { i18n, userLang } = this.config || {};
    if (userLang) {
      this.translate.setDefaultLang(userLang);
    } else if (i18n?.defaultLanguage) {
      this.translate.setDefaultLang(i18n.defaultLanguage);
    }
  }

  ngOnInit(): void {
    /* -------------------------
       Auth page padding logic
    ------------------------- */
    this.router.events.subscribe((evt) => {
      if (evt instanceof NavigationEnd) {
        const url = evt.urlAfterRedirects || evt.url;
        this.isAuthPage =
          url.startsWith('/auth/login') ||
          url.startsWith('/auth/sign-up') ||
          url.startsWith('/auth/forgot');
      }
    });

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    /* -------------------------
       Collapse navbar on click
    ------------------------- */
    const navMain = document.getElementById('navbarCollapse');
    if (navMain) {
      navMain.onclick = () => navMain.classList.remove('show');
    }

    /* -------------------------
       Restore cart from cookie
    ------------------------- */
    if (this.currentUser && this.currentUser._id) {
      const cartInfo = this.cookieService.get('cartInfo');
      if (cartInfo) {
        this.cartService.updateCartInfoFromLocal(JSON.parse(cartInfo));
      }
    }

    const { siteFavicon } = this.config || {};

    /* -------------------------
       Set favicon
    ------------------------- */
    if (siteFavicon) {
      jQuery('#favicon').attr('href', siteFavicon);
    }

    /* =========================
       🔥 GLOBAL BRAND COLORS
    ========================= */
    const PRIMARY_COLOR = '#E5563F';
    const SECONDARY_COLOR = '#092F56';

    jQuery('head').append(`
      <style type="text/css">

        /* ===== PRIMARY COLOR ===== */
        .btn,
        .btn.btn-default,
        .btn.btn-footer,
        .badge-default,
        .slot-btn,
        .available-slot.active,
        .wizard li.active,
        .wizard li:hover,
        .wizard .nav-tabs > li.active > a,
        .slot-box,
        .data-table .page-item.active .page-link {
          background-color: ${PRIMARY_COLOR} !important;
          border-color: ${PRIMARY_COLOR} !important;
        }

        .btn:hover {
          background-color: rgba(229, 86, 63, 0.85) !important;
        }

        .text-default-color,
        .color-primary,
        .hyperlink:hover,
        .nav-custom li.active a {
          color: ${PRIMARY_COLOR} !important;
        }

        /* ===== SECONDARY COLOR ===== */
        h1, h2, h3, h4, h5, h6,
        .nav-tabs .nav-link,
        .header .nav-item .nav-link,
        .menu-item,
        .card-title,
        .noti-link {
          color: ${SECONDARY_COLOR} !important;
        }

        .header .nav-item .nav-link.active,
        .header .nav-item .nav-link:hover {
          color: ${SECONDARY_COLOR} !important;
        }

        /* ===== INPUTS & CHECKS ===== */
        input:checked + .slider,
        .custom-radio input:checked ~ .checkmark {
          background-color: ${PRIMARY_COLOR} !important;
        }

        /* ===== LIGHT BACKGROUNDS ===== */
        .bg-secondary-default,
        .custom-radio .checkmark {
          background-color: rgba(229, 86, 63, 0.15) !important;
        }

        /* ===== DASHBOARD / SIDEBAR ===== */
        .wrapper-dashboard .left-sidebar .sidebar-nav-fixed,
        .wrapper-dashboard .sidebar-nav-fixed-mobile,
        .wrapper-dashboard .brand-link {
          border-bottom: 2px solid ${PRIMARY_COLOR};
        }

        a:hover {
          color: ${PRIMARY_COLOR};
        }

      </style>
    `);
  }
}
