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

  ngOnInit() {}
}
