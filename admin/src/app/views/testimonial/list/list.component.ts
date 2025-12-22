import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppPaginationComponent } from '@components/common';
import { ModalDeleteComponent } from '@components/common/modal-delete/modal-delete.component';
import { SortComponent } from '@components/common/sort/sort.component';
import {
  BorderDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  FormControlDirective,
  GutterDirective,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { cilPencil, cilTrash } from '@coreui/icons';
import { IconModule } from '@coreui/icons-angular';
import { TestimonialService } from '@services/testimonial.service';
import { UtilService } from '@services/util.service';
import { ISortOption } from 'src/interfaces';

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.component.html',
  imports: [
    RowComponent,
    ColComponent,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    GutterDirective,
    ButtonDirective,
    FormControlDirective,
    TableDirective,
    BorderDirective,
    SortComponent,
    RouterLink,
    IconModule,
    AppPaginationComponent,
    FormsModule,
    ModalDeleteComponent,
  ],
})
export class ListComponent implements OnInit {
  count: number = 0;
  items: any[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  searchFields: any = {};
  sortOption: ISortOption = {
    sortBy: 'createdAt',
    sortType: 'desc',
  };
  icons = { cilPencil, cilTrash };

  private route = inject(ActivatedRoute);
  private toasty = inject(UtilService);
  private testimonialService = inject(TestimonialService);

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const page = params['page'] ? parseInt(params['page']) : 1;
      this.currentPage = !isNaN(page) ? page : 1;
      this.query();
    });
  }

  query(): void {
    const params = {
      page: this.currentPage,
      take: this.pageSize,
      sort: this.sortOption.sortBy,
      sortType: this.sortOption.sortType,
      ...this.searchFields,
    };

    this.testimonialService.search(params).subscribe({
      next: (resp) => {
        this.count = resp?.data?.count || 0;
        this.items = resp?.data?.items || [];
      },
      error: () => {
        alert('Something went wrong, please try again!');
      },
    });
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
    this.testimonialService.delete(item._id).subscribe({
      next: () => {
        this.toasty.toastSuccess({
          title: 'Success',
          message: 'Item has been deleted!',
        });
        this.items.splice(index, 1);
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
