import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ReportService } from '@services/complaint.service';
import { UtilService } from '@services/util.service';
import { CommonModule } from '@angular/common';
import { SortComponent } from '@components/common/sort/sort.component';
import { ISortOption } from 'src/interfaces';
import { EyeIconComponent } from '@components/common/icons/eye-icon/eye-icon.component';
import {
  ButtonDirective,
  ColComponent,
  FormControlDirective,
  CardComponent,
  CardBodyComponent,
  RowComponent,
  CardHeaderComponent,
  ContainerComponent,
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { freeSet } from '@coreui/icons';
import { TutorService } from '@services/tutor.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppPaginationComponent } from '@components/index';

@Component({
  selector: 'app-request-payout-listing',
  standalone: true,
  templateUrl: './listing.html',
  imports: [
    RouterLink,
    ButtonDirective,
    ColComponent,
    FormControlDirective,
    RowComponent,
    CardComponent,
    CardBodyComponent,
    FormsModule,
    CardHeaderComponent,
    ContainerComponent,
    AppPaginationComponent,
    CommonModule,
    SortComponent,
    EyeIconComponent,
    IconDirective,
  ],
})
export class ListingComponent implements OnInit {
  public items = [];
  public take: number = 1;
  public total: number = 0;
  public searchFields = { q: '', userID: '' };
  public currentPage: number = 1;
  public pageSize: number = 10;
  sortOption: ISortOption = {
    sortBy: 'createdAt',
    sortType: 'desc',
  };
  public dateFilter: any = {};
  public stats: any;

  public searching: any = false;
  public searchFailed: any = false;
  public service: any;
  public config: any;
  icons = freeSet;

  loading = false;
  private searchSubject = new Subject<void>();
  private searchSubscription!: Subscription;

  constructor(
    private reportService: ReportService,
    private utilService: UtilService,
    private tutorService: TutorService,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe((params) => {
      const page = params['page'] ? parseInt(params['page']) : 1;
      this.currentPage = !isNaN(page) ? page : 1;
      this.query();
    });
  }
  ngOnInit(): void {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(500))
      .subscribe(() => {
        this.currentPage = 1;
        this.query();
      });
  }
  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
  onSearch() {
    this.searchSubject.next();
  }
  query() {
    this.loading = true;
    this.reportService
      .search({
        ...{
          page: this.currentPage,
          take: this.pageSize,
          sort: `${this.sortOption.sortBy}`,
          sortType: `${this.sortOption.sortType}`,
        },
        ...this.searchFields,
      })
      .subscribe((resp) => {
        this.items = resp.data.items;
        this.total = resp.data.count;
        this.loading = false;
      });
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
  resolveReport(item: any) {
    if (confirm('Are you sure you want to resolve this complaint?')) {
      this.reportService
        .update(item._id, {
          targetId: item.targetId,
          issue: item.issue,
          targetType: item.targetType,
          status: 'approved',
        })
        .subscribe((res) => {
          this.utilService.toastSuccess({ message: 'Report resolved successfully!' });
          this.query();
        });
    }
  }
  rejectReport(item: any) {
    if (confirm('Are you sure you want to reject this complaint?')) {
      this.reportService
        .update(item._id, {
          targetId: item.targetId,
          issue: item.issue,
          targetType: item.targetType,
          status: 'rejected',
        })
        .subscribe((res) => {
          this.utilService.toastSuccess({ message: 'Report rejected successfully!' });
          this.query();
        });
    }
  }
}
