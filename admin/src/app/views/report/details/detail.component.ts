import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReportService } from '@services/complaint.service';
import { AppConfigService } from '@services/app-config.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-report-detail',
  templateUrl: './detail.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class ReportDetailComponent implements OnInit {
  public report: any = {};
  private rId: any;
  public config: any;

  constructor(
    private route: ActivatedRoute,
    private reportService: ReportService,
    private appConfigService: AppConfigService
  ) {
    this.config = this.appConfigService.getConfig() ?? this.route.snapshot.data['appConfig'];
  }

  ngOnInit() {
    this.rId = this.route.snapshot.paramMap.get('id');
    this.reportService.findOne(this.rId).subscribe((resp) => {
      this.report = resp.data;
     
    });
  }
}
