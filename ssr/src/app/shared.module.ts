import { NgModule } from '@angular/core';
import { DefaultImagePipe, EllipsisPipe, AppCurrencyPipe } from './pipes';
import { StarRatingComponent } from './components/star-rating/star-rating.component';
import { NgbRatingModule } from '@ng-bootstrap/ng-bootstrap';
import { TextEllipsisComponent } from './components/uis/ellipsis.component';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { DateRangeComponent } from './components/uis/date-range/date-range.component';
import {
  MessageMessageModalComponent,
  SendMessageButtonComponent
} from './components/message/send-message-button/send-message-button.component';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SidebarComponent } from './components/uis/sidebar/sidebar.component';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ViewYoutubeModalComponent } from './components/home/view-video/popup.component';

@NgModule({
  imports: [
    NgbRatingModule,
    CommonModule,
    NgxDaterangepickerMd.forRoot(),
    FormsModule,
    TranslateModule.forChild(),
    RouterModule,
    NgSelectModule
  ],
  declarations: [
    EllipsisPipe,
    StarRatingComponent,
    TextEllipsisComponent,
    DateRangeComponent,
    SendMessageButtonComponent,
    MessageMessageModalComponent,
    DefaultImagePipe,
    SidebarComponent,
    ViewYoutubeModalComponent,
    AppCurrencyPipe
  ],
  exports: [
    EllipsisPipe,
    StarRatingComponent,
    TextEllipsisComponent,
    DateRangeComponent,
    SendMessageButtonComponent,
    DefaultImagePipe,
    SidebarComponent,
    NgSelectModule,
    ViewYoutubeModalComponent,
    AppCurrencyPipe
  ],
  providers: [CurrencyPipe],
  entryComponents: [SendMessageButtonComponent]
})
export class SharedModule {}
