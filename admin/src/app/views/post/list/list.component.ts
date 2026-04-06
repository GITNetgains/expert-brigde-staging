import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ModalDeleteComponent } from '@components/common/modal-delete/modal-delete.component';
import { SortComponent } from '@components/common/sort/sort.component';
import { AppPaginationComponent } from 'src/components/common/pagination/pagination.component';
import { EllipsisPipe } from '../ellipsis.pipe';
import {
  BorderDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  ContainerComponent,
  FormControlDirective,
  GutterDirective,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { cilPencil, cilTrash } from '@coreui/icons';
import { IconModule } from '@coreui/icons-angular';
import { PostService } from '@services/post.service';
import { UtilService } from '@services/util.service';
import { ISortOption } from 'src/interfaces';

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.component.html',
  imports: [
    ColComponent,
    ContainerComponent,
    RowComponent,
    ButtonDirective,
    FormControlDirective,
    DatePipe,
    RouterLink,
    IconModule,
    TableDirective,
    BorderDirective,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    GutterDirective,
    SortComponent,
    CommonModule,
    FormsModule,
    CommonModule,
    ModalDeleteComponent,
    AppPaginationComponent,
    EllipsisPipe,
  ],
})
export class ListComponent implements OnInit {
  count: number = 0;
  items: any[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  searchFields: any = { type: null };
  sortOption: ISortOption = {
    sortBy: 'createdAt',
    sortType: 'desc',
  };
  letterLimit: number = 10;
  icons = { cilPencil, cilTrash };
  selectedIds: string[] = [];
  allSelected: boolean = false;

  private postService = inject(PostService);
  private toasty = inject(UtilService);

  ngOnInit(): void {
    this.query();
  }

  onPageChange(event: any): void {
    const page =
      typeof event === 'number'
        ? event
        : parseInt(
            (event?.target?.value || event?.target?.innerText || this.currentPage).toString(),
            10
          );

    if (!isNaN(page) && page > 0 && page !== this.currentPage) {
      this.currentPage = page;
      this.selectedIds = [];
      this.allSelected = false;
      this.query();
    }
  }

  query(): void {
    const params = {
      page: this.currentPage,
      take: this.pageSize,
      sort: this.sortOption.sortBy,
      sortType: this.sortOption.sortType,
      ...this.searchFields,
    };

    this.postService.search(params).subscribe({
      next: (resp) => {
        this.selectedIds = [];
        this.allSelected = false;
        this.count = resp?.data?.count || 0;
        this.items = resp?.data?.items || [];
      },
      error: () => {
        this.toasty.toastError({
          title: 'Error',
          message: 'Something went wrong, please try again!',
        });
      },
    });
  }

  toggleAll() {
    this.allSelected = !this.allSelected;
    if (this.allSelected) {
      this.selectedIds = this.items.map((item) => item._id);
    } else {
      this.selectedIds = [];
    }
  }

  toggleItem(id: string) {
    const index = this.selectedIds.indexOf(id);
    if (index > -1) {
      this.selectedIds.splice(index, 1);
    } else {
      this.selectedIds.push(id);
    }
    this.allSelected = this.selectedIds.length === this.items.length;
  }

  removeSelected() {
    if (!this.selectedIds.length) return;
    if (!confirm('Are you sure you want to delete selected items?')) return;

    this.postService.bulkDelete(this.selectedIds).subscribe({
      next: () => {
        this.toasty.toastSuccess({
          title: 'Success',
          message: 'Posts have been deleted!',
        });
        this.query();
      },
      error: () => {
        this.toasty.toastError({
          title: 'Error',
          message: 'Something went wrong, please try again!',
        });
      },
    });
  }

  timeout: any;
  doSearch() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.currentPage = 1;
      this.query();
    }, 500);
  }

  keyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.doSearch();
    }
  }

  sortBy(field: string, type: string): void {
    this.sortOption.sortBy = field;
    this.sortOption.sortType = type;
    this.query();
  }

  onSort(sortOption: ISortOption): void {
    this.sortOption = sortOption;
    this.query();
  }

  remove(item: any, index: number): void {
    this.postService.delete(item._id).subscribe({
      next: () => {
        this.toasty.toastSuccess({
          title: 'Success',
          message: 'Post has been deleted!',
        });
        this.items.splice(index, 1);
        this.selectedIds = this.selectedIds.filter(id => id !== item._id);
        this.allSelected = this.selectedIds.length === this.items.length && this.items.length > 0;
        this.count--;
      },
      error: () => {
        this.toasty.toastError({
          title: 'Error',
          message: 'Something went wrong, please try again!',
        });
      },
    });
  }
}
