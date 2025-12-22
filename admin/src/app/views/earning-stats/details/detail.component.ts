import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EarningStatsService } from '@services/earning.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-earning-stats-detail',
  templateUrl: './detail.html',
  standalone: true,
  imports: [CommonModule],
})
export class EarningStatsDetailComponent implements OnInit {
  public earningStats: any = {};
  private eId: any;
  public config: any;

  constructor(
    private route: ActivatedRoute,
    private earningStatsService: EarningStatsService
  ) {
    this.config = this.route.snapshot.data['appConfig'];
  }

  ngOnInit() {
    this.eId = this.route.snapshot.paramMap.get('id');
    this.earningStatsService.findOne(this.eId).subscribe((resp) => {
      this.earningStats = resp.data;
    });
  }
}
