import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SortComponent } from '@components/common/sort/sort.component';
import { AppPaginationComponent } from '@components/index';
import {
  BorderDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardFooterComponent,
  CardHeaderComponent,
  ColComponent,
  FormControlDirective,
  FormSelectDirective,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { cilPencil, cilTrash } from '@coreui/icons';
import { IconModule } from '@coreui/icons-angular';
import { ISortOption } from 'src/interfaces';
import { UserService, UtilService } from 'src/services';
@Component({
  selector: 'app-user-list',
  templateUrl: './list.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonDirective,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    FormControlDirective,
    FormSelectDirective,
    RowComponent,
    ColComponent,
    AppPaginationComponent,
    IconModule,
    CardFooterComponent,
    SortComponent,
    TableDirective,
    BorderDirective,
  ],
})
export class ListComponent implements OnInit {
  count = 0;
  items: any[] = [];
  currentPage = 1;
  pageSize = 10;
  searchFields: any = {
    name: '',
    email: '',
    isActive: '',
    emailVerified: '',
  };
  updating = false;
  sortOption = {
    sortBy: 'createdAt',
    sortType: 'desc',
  };
  loading = false;
  icons = { cilPencil, cilTrash };
  protected Math = Math;

  // private router = inject(Router);
  // private userService = inject(UserService);
  // private utilService = inject(UtilService);

  constructor(
    private router: Router,
    private userService: UserService,
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
    const params = {
      page: this.currentPage,
      take: this.pageSize,
      sort: this.sortOption.sortBy,
      sortType: this.sortOption.sortType,
      role: 'user',
      type: 'student',
      ...this.searchFields,
    };
    this.userService.search(params).subscribe({
      next: (resp) => {
        this.count = resp.data.count;
        this.items = resp.data.items;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.utilService.toastError({
          title: 'Error',
          message: 'Failed to load users',
        });
      },
    });
  }

  onSort(sortOption: ISortOption) {
    this.sortOption = sortOption;
    this.query();
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

  remove(item: any, index: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.delete(item._id).subscribe({
        next: () => {
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'User has been deleted!',
          });
          this.items.splice(index, 1);
          this.count = this.count - 1;
        },
        error: (err) => {
          this.utilService.toastError({
            title: 'Error',
            message: 'Failed to delete user',
          });
        },
      });
    }
  }

  update(user: any, field: string, value: boolean) {
    const data: any = {};
    data[field] = value;

    if (!this.updating) {
      this.updating = true;
      this.userService.update(user._id, data).subscribe({
        next: (resp) => {
          user[field] = value;
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
            message: 'Failed to update user',
          });
        },
      });
    }
  }
}
