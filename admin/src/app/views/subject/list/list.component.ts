import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Router } from '@angular/router';
import { SubjectService } from '@services/subject.service';
import { UtilService } from '@services/util.service';
import { FormsModule } from '@angular/forms';
import { pick } from 'lodash-es';
import { SortComponent } from '@components/common/sort/sort.component';
import { ISortOption } from 'src/interfaces';
import {
  ButtonDirective,
  ColComponent,
  FormControlDirective,
  RowComponent,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ContainerComponent,
  BadgeComponent,
  CardFooterComponent,
  TableDirective,
  BorderDirective,
} from '@coreui/angular';
import { AppPaginationComponent } from '@components/index';
import { DatePipe } from '@angular/common';
import { freeSet } from '@coreui/icons';
import { IconDirective } from '@coreui/icons-angular';
import { RouterLink, ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-subject-list',
  templateUrl: './list.component.html',
  standalone: true,
  imports: [
    BadgeComponent,
    DatePipe,
    IconDirective,
    RouterLink,
    CardHeaderComponent,
    ButtonDirective,
    ColComponent,
    FormControlDirective,
    RowComponent,
    FormsModule,
    CardBodyComponent,
    CardComponent,
    AppPaginationComponent,
    SortComponent,
    CardFooterComponent,
    TableDirective,
    BorderDirective,
    ContainerComponent,
  ],
})
export class SubjectListComponent implements OnInit, OnChanges {
  public subject: any[] = [];
  public subjectCount: number = 0;
  public currentPage: number = 1;
  public pageSize: number = 10;
  @Input() categoryIds: string = '';

  count: number = 0;

  sortOption: ISortOption = {
    sortBy: 'createdAt',
    sortType: 'desc',
  };
  icons = freeSet;
  public searchFields: any = {};
  public updating: boolean = false;

  loading = false;

  constructor(
    private subjectService: SubjectService,
    private router: Router,
    private route: ActivatedRoute,
    private utilService: UtilService
  ) {
    this.route.queryParams.subscribe((params) => {
      const page = params['page'] ? parseInt(params['page']) : 1;
      this.currentPage = !isNaN(page) ? page : 1;

      this.query();
    });
  }

  ngOnInit(): void {
    if (this.categoryIds) {
      this.searchFields.categoryIds = this.categoryIds;
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoryIds'] && changes['categoryIds'].currentValue) {
      this.searchFields.categoryIds = this.categoryIds;
      this.query();
    }
  }
  query() {
    this.loading = true;

    // console.log(this.searchFields);
    const params = Object.assign(
      {
        page: this.currentPage,
        take: this.pageSize,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
      },
      this.searchFields
    );
    this.subjectService.search(params).subscribe(
      (response) => {
        this.subject = response.data.items;
        this.subjectCount = response.data.count;
      },
      (error) => {}
    );
  }

  updateSubject(subject: any) {
    const sub = pick(subject, ['name', 'alias', 'categoryIds', 'isActive']);
    sub.isActive = !subject.isActive;
    if (!this.updating) {
      this.updating = true;
      this.subjectService.update(subject.id, sub).subscribe(
        (response) => {
          this.updating = false;
          this.query();
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'Subject updated successfully',
          });
        },
        (error) => {
          // console.error('Error updating subject:', error);
          this.updating = false;
          this.utilService.toastError({
            title: 'Errors',
            message: 'error',
          });
        }
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
}
