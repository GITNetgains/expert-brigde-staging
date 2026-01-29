import { Component } from '@angular/core';
import { SeoService } from 'src/app/services';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  constructor(private seoService: SeoService) {
    this.seoService.setMetaTitle('About Us');
    this.seoService.setMetaDescription('Learn more about Expert Bridge and our mission.');
  }
}
