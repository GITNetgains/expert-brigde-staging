import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  PageItemDirective,
  PageLinkDirective,
  PaginationComponent,
} from '@coreui/angular';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  standalone: true,
  imports: [
    PaginationComponent,
    PageItemDirective,
    PageLinkDirective,
    CommonModule,
  ],
})
export class AppPaginationComponent {
  @Input() totalItems: number = 0;
  @Input() pageSize: number = 10;
  @Input() currentPage: number = 1;
  @Input() maxSize: number = 5;
  @Output() pageChanged = new EventEmitter<number>();

  get totalPages(): number {
    const itemsPerPage = this.pageSize > 0 ? this.pageSize : 10;
    const totalItems = this.totalItems >= 0 ? this.totalItems : 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    return totalPages;
  }

  getPages(): (number | string)[] {
    const totalPages = this.totalPages;
    const currentPage =
      this.currentPage > 0 ? Math.min(this.currentPage, totalPages) : 1;
    const maxSize = this.maxSize > 0 ? this.maxSize : 5;
    const pages: (number | string)[] = [];

    if (totalPages <= maxSize) {
      // Show all pages if total pages are less than or equal to maxSize
      for (let page = 1; page <= totalPages; page++) {
        pages.push(page);
      }
    } else {
      // Handle cases where maxSize is small (e.g., 1 or 2)
      if (maxSize === 1) {
        // Show only the first page, then ellipsis and last page
        pages.push(1);
        if (totalPages > 2) {
          pages.push('...');
        }
        if (totalPages > 1) {
          pages.push(totalPages);
        }
      } else {
        // maxSize >= 2: Show maxSize initial pages, then ellipsis and last page
        let startPage = 1;
        let endPage = maxSize;

        // Adjust startPage and endPage to center around currentPage
        const halfWindow = Math.floor(maxSize / 2);
        if (currentPage > halfWindow + 1) {
          startPage = currentPage - halfWindow;
          endPage = currentPage + (maxSize - halfWindow - 1);
          if (endPage >= totalPages) {
            endPage = totalPages - 1;
            startPage = totalPages - maxSize + 1;
          }
        }

        // Ensure startPage and endPage are within bounds
        startPage = Math.max(1, startPage);
        endPage = Math.min(totalPages - 1, endPage);

        // Add initial pages
        for (let page = startPage; page <= endPage; page++) {
          pages.push(page);
        }

        // Add ellipsis and last page
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        if (endPage < totalPages) {
          pages.push(totalPages);
        }
      }
    }
    return pages;
  }

  selectPage(page: number) {
    const validPage = Math.min(Math.max(1, page), this.totalPages);
    if (validPage !== this.currentPage) {
      this.pageChanged.emit(validPage);
    }
  }
}
