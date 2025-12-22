import { ActivatedRoute } from '@angular/router';
import { Component } from '@angular/core';
import { SeoService } from 'src/app/services';

@Component({
  selector: 'app-page-error',
  templateUrl: './page-error.html'
})
export class PageErrorComponent {
  public code: any;
  constructor(private route: ActivatedRoute, private seoService: SeoService) {
    this.seoService.setMetaTitle('Page error');
    this.code = this.route.snapshot.params.code;
  }
}
