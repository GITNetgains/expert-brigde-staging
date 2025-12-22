import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HeaderRoutingModule } from './header-routing.module';
import { HeaderComponent } from './header.component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { CartComponent } from '../user/cart/cart.component';
import { NotificationComponent } from '../notification/notification.component';
import { SharedModule } from 'src/app/shared.module';

@NgModule({
  declarations: [HeaderComponent, CartComponent, NotificationComponent],
  imports: [
    CommonModule,
    HeaderRoutingModule,
    NgbDropdownModule,
    TranslateModule.forChild(),
    SharedModule
  ],
  exports: [HeaderComponent, CartComponent]
})
export class HeaderModule {}
