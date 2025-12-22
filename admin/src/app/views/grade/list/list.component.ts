import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GradeService } from '../../../../services/grade.service';
import { FormsModule } from '@angular/forms';
import { UtilService } from '@services/util.service';
import { SortComponent } from '@components/common/sort/sort.component';
import { ISortOption } from 'src/interfaces';

import {
  ButtonDirective,
  BadgeComponent,
  ColComponent,
  FormControlDirective,
  CardComponent,
  CardBodyComponent,
  RowComponent,
  ContainerComponent,
  CardHeaderComponent,
  CardFooterComponent,
  TableDirective,
} from '@coreui/angular';
import { AppPaginationComponent } from '@components/index';
import { DatePipe } from '@angular/common';
import { freeSet } from '@coreui/icons';
import { IconDirective } from '@coreui/icons-angular';
import { RouterLink, ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-grade-list',
  templateUrl: './list.component.html',
  standalone: true,
  imports: [
    DatePipe,
    IconDirective,
    RouterLink,
    ButtonDirective,
    BadgeComponent,
    TableDirective,
    ColComponent,
    ContainerComponent,
    CardHeaderComponent,
    CardFooterComponent,
    FormControlDirective,
    RowComponent,
    FormsModule,
    CardComponent,
    CardBodyComponent,
    AppPaginationComponent,
    SortComponent,
  ],
})
export class GradeListComponent implements OnInit {
  public grades: any[] = [];
  public gradesCount: number = 0;
  public currentPage: number = 1;
  public pageSize: number = 10;
  public sortOption: ISortOption = {
    sortBy: 'ordering',
    sortType: 'asc',
  };
  icons = freeSet;
  public searchField: any = {};

  loading = false;

  constructor(
    private gradeService: GradeService,
    private router: Router,
    private utilService: UtilService,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe((params) => {
      const page = params['page'] ? parseInt(params['page']) : 1;
      this.currentPage = !isNaN(page) ? page : 1;
      this.query();
    });
  }

  ngOnInit(): void {}

  query() {
    this.loading = true;
    const params = Object.assign(
      {
        page: this.currentPage,
        take: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
      },
      this.searchField
    );
    this.gradeService.search(params).subscribe(
      (response) => {
        this.grades = response.data.items;
        this.gradesCount = response.data.count;
      },
      (error) => {
        // console.error('Error fetching grades:', error);
        this.utilService.toastError({
          title: 'Errors',
          message: 'error',
        });
      }
    );
  }
  sortBy(field: string, type: string) {
    this.sortOption.sortBy = field;
    this.sortOption.sortType = type;
    this.query();
  }

  onSort(sortOption: any) {
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
    this.query();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  removeGrade(gradeId: any) {
    if (window.confirm('Are you sure you want to delete this grade?')) {
      this.gradeService.delete(gradeId).subscribe(
        (response) => {
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'Remove Grade Success',
          });
          this.query();
        },
        (error) => {
          this.utilService.toastError({
            title: 'Errors',
            message: 'error',
          });
        }
      );
    }
  }
}
