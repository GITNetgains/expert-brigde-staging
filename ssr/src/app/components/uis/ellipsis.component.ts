import { Component, Input, OnInit } from '@angular/core';
// declare let jQuery: any;
import * as jQuery from 'jquery';
import { AppService } from 'src/app/services';

@Component({
  selector: 'app-text-ellipsis',
  template: `<div class="card-text" *ngIf="content">
    <span class="more" [innerHTML]="content"></span>
  </div>`
  // <a [routerLink]="[path, param]" class="morelink"><span translate>Read more</span>...</a>
})
export class TextEllipsisComponent implements OnInit {
  @Input() content = '';
  @Input() showChar = 50;
  @Input() path = '';
  @Input() param = '';
  constructor(
    private appService: AppService
  ) { }

  ngOnInit() {
    const showChar = this.showChar;
    if (this.content && this.appService.isBrowser) {
      (function ($) {
        $(document).ready(function () {
          //   const showChar = showChar; // How many characters are shown by default
          const ellipsestext = '...';
          let content = '';
          $('.more').each(function (this: any) {
            content = $(this).text();
            if (content.length > showChar) {
              const c = content.substr(0, showChar);
              const html =
                c + '<span class="moreellipses">' + ellipsestext + '&nbsp;</span>' + '</span>&nbsp;&nbsp;' + '</span>';
              $(this).html(html);
            } else {
              const html =
                content + '<span class="moreellipses">' + '&nbsp;</span>' + '</span>&nbsp;&nbsp;' + '</span>';
              $(this).html(html);
            }
          });
        });
      })(jQuery);
    }
  }
}
