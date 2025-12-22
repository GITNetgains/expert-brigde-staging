import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppPaginationComponent } from '@components/common';
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
  Tabs2Module,
} from '@coreui/angular';
import { cilPencil } from '@coreui/icons';
import { IconModule } from '@coreui/icons-angular';
import { TemplateService } from '@services/template.service';
import { UtilService } from '@services/util.service';
import { pick } from 'lodash-es';
import { BehaviorSubject, catchError, tap, throwError } from 'rxjs';
import { ISortOption } from 'src/interfaces';

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.component.html',
  imports: [
    CommonModule,
    RowComponent,
    ColComponent,
    GutterDirective,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    ButtonDirective,
    FormControlDirective,
    Tabs2Module,
    TableDirective,
    BorderDirective,
    RouterLink,
    IconModule,
    SortComponent,
    FormsModule,
    AppPaginationComponent,
  ],
})
export class ListComponent implements OnInit {
  count = 0;
  items: any[] = [];
  currentPage = 1;
  pageSize = 10;
  searchFields: any = {};
  sortOption: ISortOption = {
    sortBy: 'createdAt',
    sortType: 'desc',
  };
  updating = false;
  groups = [
    'auth',
    'appointment',
    'tutor',
    'user',
    'course',
    'groupclass',
    'review',
    'material',
    'payment',
    'payout',
    'refund',
    'other',
  ];
  activeGroup = 'auth';
  icons = { cilPencil };

  private itemsSubject = new BehaviorSubject<any[]>([]);

  items$ = this.itemsSubject.asObservable();

  private route = inject(ActivatedRoute);
  private toasty = inject(UtilService);
  private templateService = inject(TemplateService);

  ngOnInit(): void {
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
      group: this.activeGroup,
      ...this.searchFields,
    };

    this.templateService
      .search(params)
      .pipe(
        tap((resp) => {
          this.count = resp.data.count;
          this.itemsSubject.next(resp.data.items);
          this.items = resp.data.items;
        }),
        catchError(() => {
          this.toasty.toastError({
            title: 'Error',
            message: 'Something went wrong, please try again!',
          });
          return throwError(() => new Error('Query failed'));
        })
      )
      .subscribe();
  }

  sortBy(field: string, type: string): void {
    this.sortOption.sortBy = field;
    this.sortOption.sortType = type;
    this.query();
  }

  onSort(sortOption: { sortBy: string; sortType: string }): void {
    this.sortOption = sortOption;
    this.query();
  }

  remove(item: any, index: number): void {
    if (window.confirm('Are you sure to delete this template?')) {
      this.templateService
        .delete(item._id)
        .pipe(
          tap(() => {
            this.toasty.toastSuccess({
              title: 'Success',
              message: 'Item has been deleted!',
            });
            this.items.splice(index, 1);
            this.itemsSubject.next([...this.items]);
            this.count--;
          }),
          catchError(() => {
            this.toasty.toastError({
              title: 'Error',
              message: 'Something went wrong, please try again!',
            });
            return throwError(() => new Error('Delete failed'));
          })
        )
        .subscribe();
    }
  }

  update(template: any): void {
    const cat = pick(template, [
      'name',
      'alias',
      'description',
      'ordering',
      'isActive',
      'imageId',
    ]);
    cat.isActive = !template.isActive;

    if (!this.updating) {
      this.updating = true;
      this.templateService
        .update(template._id, cat)
        .pipe(
          tap((resp) => {
            template.isActive = cat.isActive;
            this.itemsSubject.next([...this.items]);
            this.updating = false;
            this.toasty.toastSuccess({
              title: 'Success',
              message: cat.isActive ? 'Activated!' : 'Deactivated!',
            });
          }),
          catchError((err) => {
            this.updating = false;
            this.toasty.toastError({
              title: 'Error',
              message: err.data?.data?.message || 'Something went wrong!',
            });
            return throwError(() => new Error('Update failed'));
          })
        )
        .subscribe();
    }
  }

  groupName(group: string): string {
    const groupNames: { [key: string]: string } = {
      auth: 'Auth',
      appointment: 'Appointment',
      tutor: 'Tutor',
      user: 'User',
      course: 'Course',
      groupclass: 'Group Class',
      review: 'Review',
      material: 'Material',
      payment: 'Payment - Transaction',
      payout: 'Payout',
      refund: 'Refund',
      other: 'Other Templates',
    };
    return groupNames[group] || '';
  }

  selectGroup(group: string): void {
    this.activeGroup = group;
    this.query();
  }
}
