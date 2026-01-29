import { Component } from '@angular/core';
import { SeoService } from 'src/app/services';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent {
  constructor(private seoService: SeoService) {
    this.seoService.setMetaTitle('Services');
    this.seoService.setMetaDescription('Explore Expert Bridge services: courses, webinars, and tutoring.');
  }
}
