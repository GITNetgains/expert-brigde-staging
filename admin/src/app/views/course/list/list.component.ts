import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { pick } from 'lodash-es';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterModule,
} from '@angular/router';
import {
  BadgeComponent,
  BorderDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardFooterComponent,
  CardHeaderComponent,
  ColComponent,
  ContainerComponent,
  FormSelectDirective,
  FormControlDirective,
  GutterDirective,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  tap,
  switchMap,
  map,
  catchError,
  of,
} from 'rxjs';

import { SortComponent } from 'src/components/common/sort/sort.component';
import { AppPaginationComponent } from 'src/components/common/pagination/pagination.component';
import { EyeIconComponent } from 'src/components/common/icons/eye-icon/eye-icon.component';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  CategoryService,
  CourseService,
  TutorService,
  UtilService,
} from 'src/services';
import { AppConfigService } from '@services/app-config.service';
import { ICourse, ISortOption } from 'src/interfaces';
import { IconModule } from '@coreui/icons-angular';
import { cilTrash, cilPencil } from '@coreui/icons';

@Component({
  selector: 'app-course-listing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    RouterLink,
    NgSelectModule,
    FormSelectDirective,
    FormControlDirective,
    SortComponent,
    AppPaginationComponent,
    ContainerComponent,
    RowComponent,
    ColComponent,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    CardFooterComponent,
    GutterDirective,
    TableDirective,
    BorderDirective,
    BadgeComponent,
    IconModule,
    EyeIconComponent,
  ],
  templateUrl: './list.html',
})
export class CourseListingComponent implements OnInit {
  private router = inject(Router);
  private courseService = inject(CourseService);
  private utilService = inject(UtilService);
  private tutorService = inject(TutorService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private appConfigService = inject(AppConfigService);

  count: number = 0;
  items: ICourse[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  searchFields: any = { name: '', approved: '' };
  categories: any[] = [];
  categoryIds: any;
  config: any;
  sortOption: ISortOption = {
    sortBy: 'createdAt',
    sortType: 'desc',
  };
  updating: boolean = false;

  searching = false;
  searchFailed = false;
  tutorId: any;
  loading = false;

  tutorItems: any[] = [];
  tutorInput$ = new Subject<string>();
  icons = { cilTrash, cilPencil };
  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const page = parseInt(params['page']) || 1;
      this.currentPage = !isNaN(page) ? page : 1;
      this.query();
    });

    this.config = this.appConfigService.getConfig() ?? this.route.snapshot.data['appConfig'];
    this.queryCategories();
    this.initSearchStreams();
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

  initSearchStreams() {
    this.tutorInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.searching = true)),
        switchMap((term) =>
          this.tutorService.search({ name: term }).pipe(
            map((resp: any) => resp.data.items),
            catchError(() => of([])),
            tap(() => (this.searching = false))
          )
        )
      )
      .subscribe((items) => (this.tutorItems = items));
  }

  query() {
    const params: any = {
      page: this.currentPage,
      take: this.pageSize,
      sort: this.sortOption.sortBy,
      sortType: this.sortOption.sortType,
      ...this.searchFields,
    };

    if (this.tutorId) params.tutorId = this.tutorId;
    if (this.categoryIds) params.categoryIds = this.categoryIds.toString();

    this.loading = true;

    this.courseService.search(params).subscribe({
      next: (resp: any) => {
        this.count = resp.data.count;
        this.items = resp.data.items;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.utilService.toastError({
          title: 'Error',
          message: 'Something went wrong, please try again!',
        });
      },
    });
  }

  sortBy(field: string, type: 'asc' | 'desc') {
    this.sortOption.sortBy = field;
    this.sortOption.sortType = type;
    this.query();
  }

  onSort(sortOption: ISortOption) {
    this.sortOption = sortOption;
    this.query();
  }

  queryCategories() {
    this.categoryService.search({ take: 10 }).subscribe({
      next: (resp: any) => {
        this.categories = resp.data.items;
      },
      error: () => {
        this.utilService.toastError({
          title: 'Error',
          message: 'Something went wrong, please try again!',
        });
      },
    });
  }

  remove(item: ICourse, index: number) {
    if (window.confirm('Are you sure to delete this course?')) {
      this.courseService.delete(item._id).subscribe({
        next: () => {
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'Item has been deleted!',
          });
          this.items.splice(index, 1);
          this.count--;
        },
        error: (err: any) => {
          this.utilService.toastError({
            title: 'Error',
            message:
              err.data?.data?.message ||
              'Something went wrong, please try again!',
          });
        },
      });
    }
  }

  update(course: any, field: string, value: Boolean) {
    const data: any = pick(course, [
      'tutorId',
      'name',
      'price',
      'description',
      'alias',
      'categoryIds',
      'introductionVideoId',
      'mainImageId',
      'isFree',
      'featured',
    ]);
    data[field] = value;
    if (!this.updating) {
      this.updating = true;
      this.courseService.update(course._id, data).subscribe({
        next: (resp) => {
          course[field] = value;
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'Updated successfully!',
          });
          this.updating = false;
        },
        error: (err) => {
          this.updating = false;
          this.utilService.toastError({
            title: 'Error',
            message: 'Something went wrong, please check and try again!',
          });
        },
      });
    }
  }

  disable(course: ICourse) {
    this.courseService.disable(course._id).subscribe({
      next: () => {
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'Updated successfully!',
        });
        this.updating = false;
        course.disabled = true;
      },
      error: () => {
        this.updating = false;
        this.utilService.toastError({
          title: 'Error',
          message: 'Something went wrong, please check and try again!',
        });
      },
    });
  }

  enable(course: ICourse) {
    this.courseService.enable(course._id).subscribe({
      next: () => {
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'Updated successfully!',
        });
        this.updating = false;
        course.disabled = false;
      },
      error: () => {
        this.updating = false;
        this.utilService.toastError({
          title: 'Error',
          message: 'Something went wrong, please check and try again!',
        });
      },
    });
  }
  loadTutors() {
    this.tutorService.search({ take: 10 }).subscribe({
      next: (resp: any) => {
        if (resp.data && resp.data.items) {
          this.tutorItems = resp.data.items;
        }
      },
      error: (err: any) => {
        this.utilService.toastError({
          title: 'Error',
          message: err.data?.message || 'Failed to load experts',
        });
      },
    });
  }
}
