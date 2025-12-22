import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { STATE, SeoService, StateService } from 'src/app/services';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-work',
  templateUrl: './word.html'
})
export class WorkComponent implements OnInit {
  public config: any;
  public iframe: any;
  public banner = 'url(' + 'assets/how-it-works/livelearn-bg.svg' + ')';

  constructor(
    public router: Router,
    private seoService: SeoService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private stateService: StateService
  ) {
    this.seoService.setMetaTitle('How it works');
    this.config = this.stateService.getState(STATE.CONFIG);
    this.seoService.addMetaTags([
      {
        property: 'og:title',
        content: 'How does it work?'
      },
      {
        property: 'og:image',
        content:
          this.config?.homepagePicture &&
          this.config?.homepagePicture?.howItWork
            ? this.config?.homepagePicture?.howItWork
            : `${environment.url}/assets/images/tutors01.jpg`
      },
      {
        property: 'og:description',
        content:
          'We provide three types of learning modes: Self-paced courses, Live 1-on-classes, Live group webinars.'
      },
      {
        name: 'keywords',
        content: 'How does it work?'
      }
    ]);
  }
  ngOnInit() {
    if (Object.keys(this.config).length > 0) {
      this.iframe = this.setUrl(this.config.youtubeHowItWork);
      if (
        this.config.teachWithUsPicture &&
        this.config.teachWithUsPicture.banner
      ) {
        this.banner = `url(${this.config.teachWithUsPicture.banner})`;
      }
    }
  }

  setUrl(urlYoutubeHowItWork: string) {
    return this.sanitizer.bypassSecurityTrustHtml(urlYoutubeHowItWork);
  }
}
