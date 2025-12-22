import { IconModule } from '@coreui/icons-angular';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TutorService, UtilService } from 'src/services';
import { cilCheckCircle, cilXCircle, cilPencil } from '@coreui/icons';
import {
  ButtonDirective,
  CardComponent,
  CardBodyComponent,
  CardHeaderComponent,
  FormControlDirective,
  FormSelectDirective,
  CardFooterComponent,
  TableDirective,
  BorderDirective,
} from '@coreui/angular';
import { AppPaginationComponent } from '@components/index';
import { ISortOption } from 'src/interfaces';
import { SortComponent } from '@components/common/sort/sort.component';
@Component({
  selector: 'app-tutor-list',
  templateUrl: './list.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    FormControlDirective,
    FormSelectDirective,
    IconModule,
    AppPaginationComponent,
    CardFooterComponent,
    SortComponent,
    TableDirective,
    BorderDirective,
  ],
})
export class ListComponent implements OnInit {
  count: number = 0;
  items: any[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  searchFields: any = {
    name: '',
    email: '',
    status: '',
    rating: '',
  };
  sortOption = {
    sortBy: 'createdAt',
    sortType: 'desc',
  };
  updating: boolean = false;
  loading: boolean = false;
  icons = { cilCheckCircle, cilXCircle, cilPencil };

  constructor(
    private router: Router,
    private tutorService: TutorService,
    private utilService: UtilService,
    private route: ActivatedRoute
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

  query() {
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

    this.tutorService.search(params).subscribe({
      next: (resp) => {
        this.count = resp.data.count;
        this.items = resp.data.items;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.utilService.toastError({
          title: 'Error',
          message: 'Something went wrong, please try again!',
        });
      },
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

  update(tutor: any, field: string, value: boolean) {
    if (!this.updating) {
      this.updating = true;
      const data: any = {
        name: tutor.name,
        username: tutor.username,
        email: tutor.email,
        isActive: tutor.isActive,
        emailVerified: tutor.emailVerified,
        isHomePage: tutor.isHomePage,
        featured: tutor.featured,
      };
      data[field] = value;

      this.tutorService.update(tutor._id, data).subscribe({
        next: (resp) => {
          tutor[field] = value;
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
            message: 'Something went wrong, please try again!',
          });
        },
      });
    }
  }
  changeStatus(tutor: any) {
    if (!this.updating) {
      this.updating = true;
      this.tutorService.changeStatus(tutor._id).subscribe({
        next: (resp) => {
          tutor.isActive = !tutor.isActive;
          const message = tutor.isActive ? 'Activated' : 'Deactivated';
          this.utilService.toastSuccess({
            title: 'Success',
            message: message,
          });
          this.updating = false;
        },
        error: (err) => {
          this.updating = false;
          this.utilService.toastError({
            title: 'Error',
            message: 'Something went wrong, please try again!',
          });
        },
      });
    }
  }
}
