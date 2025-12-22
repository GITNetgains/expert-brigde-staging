import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { WebinarService } from '@services/webinar.service';
import { CourseService } from '@services/course.service';
import { UtilService } from '@services/util.service';
import { TutorService } from '@services/tutor.service';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AppPaginationComponent } from '@components/index';
import { NgSelectComponent } from '@ng-select/ng-select';
import { SortComponent } from '@components/common/sort/sort.component';
import { ISortOption } from 'src/interfaces';

import {
  BadgeComponent,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ContainerComponent,
  CardFooterComponent,
  ColComponent,
  FormControlDirective,
  RowComponent,
  TableDirective,
  BorderDirective,
} from '@coreui/angular';
import { pick } from 'lodash-es';
import { IconDirective } from '@coreui/icons-angular';
import { CategorySelectComponent } from '@components/index';
@Component({
  selector: 'app-webinar-listing',
  standalone: true,
  templateUrl: './list.html',
  imports: [
    RouterLink,
    IconDirective,
    RowComponent,
    ColComponent,
    FormControlDirective,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    ContainerComponent,
    CardHeaderComponent,
    CardFooterComponent,
    BadgeComponent,
    TableDirective,
    BorderDirective,
    DatePipe,
    FormsModule,
    AppPaginationComponent,
    NgSelectComponent,
    CategorySelectComponent,
    SortComponent,
  ],
})
export class WebinarListComponent implements OnInit {
  public updating: Boolean = false;
  public categoryId: any;
  public items: any[] = [];
  public currentPage: number = 1;
  public pageSize: number = 10;
  public total: number = 0;
  public searchFields: any = {};
  public tutor: any = [];
  public searchTutor: any = {
    take: 100,
    name: '',
  };
  sortOption: ISortOption = {
    sortBy: 'createdAt',
    sortType: 'desc',
  };
  public searching: boolean = false;
  public config: any;
  public courseId: string | null = null;
  public courseList: any[] = [];
  public tutorList: any[] = [];
  public tutorId: string | null = null;
  loading = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private webinarService: WebinarService,
    private courseService: CourseService,
    private utilService: UtilService,
    private tutorService: TutorService
  ) {
    this.route.queryParams.subscribe((params) => {
      const page = params['page'] ? parseInt(params['page']) : 1;
      this.currentPage = !isNaN(page) ? page : 1;
      this.query();
    });
  }
  ngOnInit() {
    // Query is already called in constructor via route.queryParams.subscribe
    // No need to call it again here to avoid duplicate API calls
  }

  onPageChange(event: any) {
    const page =
      typeof event === 'number'
        ? event
        : parseInt(event.target.value || event.target.innerText, 10);
    this.currentPage = page;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: this.currentPage },
      queryParamsHandling: 'merge',
    });
  }

  filter() {
    this.currentPage = 1;

    // Always call query() directly first to ensure filtering works immediately
    this.query();

    // Update URL to reflect page 1 for consistency and browser history
    // Use replaceUrl to avoid adding unnecessary history entries
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
  query() {
    this.loading = true;

    const paramsTutor = Object.assign(this.searchTutor);
    this.tutorService.search(paramsTutor).subscribe({
      next: (resp) => {
        this.tutor = resp.data.items;
      },
    });
    if (this.tutorId) {
      this.searchFields.tutorId = this.tutorId;
    } else {
      delete this.searchFields.tutorId;
    }

    const params = Object.assign(
      {
        page: this.currentPage,
        pageSize: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
      },
      this.searchFields
    );
    if (this.categoryId) {
      params.categoryIds = this.categoryId.toString();
    }
    this.webinarService.search(params).subscribe((resp) => {
      this.items = resp.data.items;
      this.total = resp.data.count;
      // console.log('items', this.items[0]);
      this.loading = false;
    });
  }
  update(webinar: any, field: string, value: Boolean) {
    const allowedFields = [
      'name',
      'maximumStrength',
      'categoryIds',
      'isOpen',
      'price',
      'mediaIds',
      'mainImageId',
      'description',
      'featured',
      'subjectIds',
      'topicIds',
    ];

    if (!allowedFields.includes(field)) {
      return;
    }

    const data = pick(webinar, allowedFields);
    data[field] = value;
    if (!this.updating) {
      this.updating = true;
      this.webinarService.update(webinar._id, data).subscribe(
        (resp) => {
          webinar[field] = value;
          this.updating = false;
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'Webinar updated successfully.',
          });
        },
        (error) => {
          this.updating = false;
          this.utilService.toastError({
            title: 'Error',
            message: 'Failed to update webinar.',
          });
        }
      );
    }
  }
  changeStatus(webinar: any) {
    if (!this.updating) {
      this.updating = true;
      this.webinarService.changeStatus(webinar._id).subscribe((resp) => {
        webinar['disabled'] = !webinar.disabled;

        const message = webinar.disabled ? 'Disabled' : 'Enabled';
        this.utilService.toastSuccess({
          title: 'Success',
          message: message,
        });
        this.updating = false;
      });
    }
  }
  selectCategory(event: any) {
    this.categoryId = event;
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
