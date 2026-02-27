import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/shared.module';
import { CommonModule } from '@angular/common';
import { IWebinar } from 'src/app/interface';
import { SystemService, WebinarService } from 'src/app/services';
@Component({
  standalone: true,
  selector: 'app-card-webinar',
  templateUrl: './card-webinar.html',
  imports: [RouterModule, SharedModule, CommonModule, TranslateModule]
})
export class CardWebinarComponent implements OnInit {
  @Input() webinar: IWebinar;
  public description: string;
  @Input() config: any;
  constructor(public systemService: SystemService) {}

  ngOnInit() {
    // Ensure we always have config for commission fallback
    if (!this.config) {
      this.config = this.systemService.appConfig;
    }
  }

  get displayPrice(): number {
    const base = this.webinar?.price || 0;
    if (!base) return 0;
    const tutorRate =
      (this.webinar as any)?.tutor &&
      typeof (this.webinar as any).tutor.commissionRate === 'number'
        ? (this.webinar as any).tutor.commissionRate
        : null;
    const configRate =
      this.config && typeof this.config.commissionRate === 'number'
        ? this.config.commissionRate
        : 0;
    const effective = (tutorRate != null ? tutorRate : configRate) || 0;
    return base * (1 + effective);
  }
}
