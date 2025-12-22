import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService } from '../../../../services';
import { FormsModule } from '@angular/forms';
import { pick } from 'lodash';
import { ISortOption } from 'src/interfaces';
import { SortComponent } from '@components/common/sort/sort.component';

import {
  ButtonDirective,
  ColComponent,
  FormControlDirective,
  RowComponent,
  CardComponent,
  CardBodyComponent,
  BadgeComponent,
  TableDirective,
  ContainerComponent,
  CardHeaderComponent,
  CardFooterComponent,
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
    FormControlDirective,
    RowComponent,
    FormsModule,
    CardComponent,
    CardBodyComponent,
    AppPaginationComponent,
    ContainerComponent,
    CardHeaderComponent,
    SortComponent,
    CardFooterComponent,
  ],
})
export class GradeListComponent implements OnInit {
  public category: any[] = [];
  public categoryCount: number = 0;
  public currentPage: number = 1;
  public pageSize: number = 10;
  sortOption: ISortOption = {
    sortBy: 'ordering',
    sortType: 'asc',
  };
  icons = freeSet;
  public searchField: any = {};
  public updating: boolean = false;

  loading = false;

  constructor(
    private categorieService: CategoryService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe((params) => {
      const page = params['page'] ? parseInt(params['page']) : 1;
      this.currentPage = !isNaN(page) ? page : 1;
      this.query();
    });
  }

  ngOnInit(): void {
    // The query is already called in the constructor via route.queryParams.subscribe,
    // so there is no need to call it again here.
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
      this.searchField
    );
    this.categorieService.search(params).subscribe(
      (response) => {
        this.category = response.data.items;
        this.categoryCount = response.data.count;
      },
      (error) => {}
    );
  }

  // navigateToGradeDetails(gradeId: number) {
  //   this.router.navigate(['/grade/details', gradeId]);
  // }
  removeGrade(gradeId: any) {
    if (window.confirm('Are you sure you want to delete this categories')) {
      this.categorieService.delete(gradeId).subscribe(
        (response) => {
          // console.log('Garde deleted successfully:', response);
          this.query(); // Refresh the list after deletion
        },
        (error) => {}
      );
    }
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
    this.query();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
  updateCategory(category: any) {
    const cat = pick(category, [
      'name',
      'alias',
      'description',
      'ordering',
      'isActive',
      'imageId',
    ]);
    cat.isActive = !category.isActive;
    if (!this.updating) {
      this.updating = true;
      this.categorieService.update(category._id, cat).subscribe(
        (response) => {
          this.updating = false;
          this.query(); // Refresh the list after update
        },
        (error) => {
          console.error('Error updating grade:', error);
          this.updating = false;
        }
      );
    }
  }
}
