import { Component, inject, OnInit, viewChild } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';

import {
  ContainerComponent,
  ShadowOnScrollDirective,
  SidebarBrandComponent,
  SidebarComponent,
  SidebarFooterComponent,
  SidebarHeaderComponent,
  SidebarNavComponent,
  SidebarToggleDirective,
  SidebarTogglerDirective,
  ToasterComponent,
  ToasterPlacement,
} from '@coreui/angular';

import { DefaultFooterComponent, DefaultHeaderComponent } from './';
import { navItems } from './_nav';
import { UtilService } from '../../../services';
import { IToast } from '../../../interfaces';
import { AppToastComponent } from '@components/toast';

function isOverflown(element: HTMLElement) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss'],
  imports: [
    SidebarComponent,
    SidebarHeaderComponent,
    SidebarBrandComponent,
    SidebarNavComponent,
    SidebarFooterComponent,
    SidebarToggleDirective,
    SidebarTogglerDirective,
    ContainerComponent,
    DefaultFooterComponent,
    DefaultHeaderComponent,
    NgScrollbar,
    RouterOutlet,
    RouterLink,
    ShadowOnScrollDirective,
    ToasterComponent,
  ],
})
export class DefaultLayoutComponent implements OnInit {
  public navItems = [...navItems];
  placement = ToasterPlacement.BottomEnd;

  readonly toaster = viewChild(ToasterComponent);
  readonly utilService = inject(UtilService);

  ngOnInit(): void {
    this.utilService.toastValues$.subscribe((values) => {
      if (values && values.open) {
        this.addToast(values.options as IToast);
      }
    });
  }

  addToast(options?: IToast) {
    const componentRef = this.toaster()?.addToast(AppToastComponent, {
      ...options,
    });
    if (componentRef) {
      options?.message && (componentRef.instance.message = options.message);
      options?.color && (componentRef.instance.colorIcon = options.color);
      options?.placement &&
        (this.placement = options.placement as ToasterPlacement);
    }
  }
}
