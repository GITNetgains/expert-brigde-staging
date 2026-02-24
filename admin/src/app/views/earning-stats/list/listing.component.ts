import { Component, OnInit } from '@angular/core';
import { EarningStatsService } from '@services/earning.service';
import { UtilService } from '@services/util.service';
import { AppConfigService } from '@services/app-config.service';
import { CommonModule } from '@angular/common';
import { saveAs } from 'file-saver';
import { EyeIconComponent } from '@components/common/icons/eye-icon/eye-icon.component';
import { TutorService } from '@services/tutor.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppPaginationComponent } from '@components/index';
import { NgSelectComponent } from '@ng-select/ng-select';
import {
  ButtonDirective,
  ColComponent,
  CardComponent,
  CardBodyComponent,
  RowComponent,
  CardHeaderComponent,
  ContainerComponent,
} from '@coreui/angular';
import { SortComponent } from '@components/common/sort/sort.component';
import { ISortOption } from 'src/interfaces';

@Component({
  selector: 'app-request-payout-listing',
  standalone: true,
  templateUrl: './listing.html',
  imports: [
    RouterLink,
    ButtonDirective,
    ColComponent,
    RowComponent,
    CardComponent,
    CardBodyComponent,
    FormsModule,
    CardHeaderComponent,
    ContainerComponent,
    AppPaginationComponent,
    CommonModule,
    NgSelectComponent,
    SortComponent,
    EyeIconComponent,
  ],
})
export class ListingEarningComponent implements OnInit {
  public items = [];
  public tutor: any = {};
  public currentPage: number = 1;
  public pageSize: number = 10;
  public total: number = 0;
  public searchFields: any = {};
  public searchTutor: any = { take: 100 };
  sortOption: ISortOption = {
    sortBy: 'createdAt',
    sortType: 'desc',
  };
  public dateFilter: any = {};
  public stats: any;
  public tutorId: any;
  public searching: any = false;
  public searchFailed: any = false;
  public service: any;
  public config: any;
  loading = false;
  constructor(
    private earningStatsService: EarningStatsService,
    private utilService: UtilService,
    private route: ActivatedRoute,
    private tutorService: TutorService,
    private appConfigService: AppConfigService
  ) {
    this.config = this.appConfigService.getConfig() ?? this.route.snapshot.data['appConfig'];
    this.route.queryParams.subscribe((params) => {
      const page = params['page'] ? parseInt(params['page']) : 1;
      this.currentPage = !isNaN(page) ? page : 1;
      this.query();
    });
  }
  ngOnInit(): void {}
  query() {
    const paramsTutor = Object.assign(this.searchTutor);

    this.tutorService.search(paramsTutor).subscribe((resp) => {
      this.tutor = resp.data.items;
    });
    this.loading = true;
    const params = Object.assign(
      {
        page: this.currentPage,
        take: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
      },
      this.searchFields
    );
    this.earningStatsService.search(params).subscribe(
      (resp) => {
        this.total = resp.data.count;
        this.items = resp.data.items;
        this.loading = false;
        // console.log('items', this.items);
      },
      (error) => {
        this.loading = false;
      }
    );
  }
  export(event: any) {
    this.loading = true;

    const params = Object.assign(
      {
        page: this.currentPage,
        take: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
      },
      this.searchFields
    );
    if (this.tutorId) {
      params.tutorId = this.tutorId._id;
    }
    if (event.target.value) {
      this.earningStatsService
        .export(event.target.value, params)
        .subscribe((blob) => {
          const allowedTypes = ['csv', 'xlsx'];
          const type = allowedTypes.includes(event.target.value)
            ? event.target.value
            : 'csv';
          const fileName = `earnings.${type}`;
          saveAs(blob, fileName);
        });
    }
  }
  onTutorCleared() {
    this.searchFields = {};
    this.query();
  }
  sortBy(field: string, type: string) {
    this.sortOption.sortBy = field;
    this.sortOption.sortType = type;
    this.query();
  }

  onSort(sortOption: ISortOption) {
    this.sortOption = sortOption;
    this.query();
  }
}
