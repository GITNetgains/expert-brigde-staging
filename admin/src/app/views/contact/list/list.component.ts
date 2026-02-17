import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  BorderDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  FormControlDirective,
  RowComponent,
  TableDirective,
  CardFooterComponent,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { cilTrash } from '@coreui/icons';
import { AppPaginationComponent } from '@components/common';
import { SortComponent } from '@components/common/sort/sort.component';
import { EyeIconComponent } from '@components/common/icons/eye-icon/eye-icon.component';
import { ContactService } from '@services/contact.service';
import { UtilService } from '@services/util.service';
import { ISortOption } from 'src/interfaces';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  templateUrl: './list.component.html',
  imports: [
    ColComponent,
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
    CardFooterComponent,
    SortComponent,
    CommonModule,
    FormsModule,
    AppPaginationComponent,
    EyeIconComponent,
  ],
})
export class ListComponent implements OnInit {
  count = 0;
  items: any[] = [];
  currentPage = 1;
  pageSize = 10;
  searchFields: any = { name: '', email: '', companyName: '', phoneNumber: '' };
  sortOption: ISortOption = {
    sortBy: 'createdAt',
    sortType: 'desc',
  };
  icons = { cilTrash };
  loading = false;

  private contactService = inject(ContactService);
  private toasty = inject(UtilService);

  ngOnInit(): void {
    this.query();
  }

  query(): void {
    this.loading = true;
    const params: any = {
      page: this.currentPage,
      take: this.pageSize,
      sort: this.sortOption.sortBy,
      sortType: this.sortOption.sortType,
      name: this.searchFields.name || undefined,
      email: this.searchFields.email || undefined,
      companyName: this.searchFields.companyName || undefined,
      phoneNumber: this.searchFields.phoneNumber || undefined,
    };
    this.contactService.search(params).subscribe({
      next: (resp) => {
        this.items = resp.data.items || [];
        this.count = resp.data.count || 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toasty.toastError({
          title: 'Error',
          message: 'Failed to load contacts',
        });
      },
    });
  }

  filter(): void {
    this.currentPage = 1;
    this.query();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.query();
  }

  onSort(event: ISortOption): void {
    this.sortOption = event;
    this.query();
  }

  remove(item: any, index: number): void {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    this.contactService.delete(item._id).subscribe({
      next: () => {
        this.toasty.toastSuccess({
          title: 'Success',
          message: 'Contact has been deleted!',
        });
        this.items.splice(index, 1);
        this.count = Math.max(0, this.count - 1);
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
