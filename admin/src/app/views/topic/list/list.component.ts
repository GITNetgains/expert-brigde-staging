import { Component, OnInit, Input } from '@angular/core';
import { TopicService } from '@services/topic.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { pick } from 'lodash-es';
import { FormsModule } from '@angular/forms';
import { UtilService } from '@services/util.service';
import { SortComponent } from '@components/common/sort/sort.component';
import { ISortOption } from 'src/interfaces';
import {
  BadgeComponent,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  ContainerComponent,
  FormControlDirective,
  RowComponent,
  CardFooterComponent,
  TableDirective,
} from '@coreui/angular';
import { AppPaginationComponent } from '@components/index';

import { IconDirective } from '@coreui/icons-angular';

@Component({
  selector: 'app-topic-list',
  templateUrl: './list.component.html',
  standalone: true,
  imports: [
    RouterLink,
    IconDirective,
    RowComponent,
    ColComponent,
    FormControlDirective,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    BadgeComponent,
    DatePipe,
    FormsModule,
    TableDirective,
    AppPaginationComponent,
    SortComponent,
    CardFooterComponent,
    ContainerComponent,
  ],
})
export class ListTopicComponent implements OnInit {
  @Input() subjectIds: string = '';
  public searchFields: any = { name: '', tutorName: '' };
  public topics: any[] = [];
  public topicCount: number = 0;
  public currentPage: number = 1;
  public pageSize: number = 10;
  sortOption: ISortOption = {
    sortBy: 'createdAt',
    sortType: 'desc',
  };
  public updating: boolean = false;
  loading = false;

  constructor(
    private topicService: TopicService,
    private utilService: UtilService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.queryParams.subscribe((params) => {
      const page = params['page'] ? parseInt(params['page']) : 1;
      this.currentPage = !isNaN(page) ? page : 1;
      this.query();
    });
  }
  ngOnInit(): void {
    if (this.subjectIds) {
      this.searchFields.subjectIds = this.subjectIds;
    }
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
    this.topicService.search(params).subscribe((res) => {
      this.topics = res.data.items;
      // console.log(
      //   '🚀 ~ ListTopicComponent ~ this.topicService.search ~  this.topics :',
      //   this.topics
      // );
      this.topicCount = res.data.count;
    });
  }

  deleteTopic(id: number): void {
    this.topics = this.topics.filter((topic) => topic.id !== id);
  }
  updateTopic(topic: any) {
    this.loading = true;
    const t = pick(topic, [
      'name',
      'alias',
      'categoryIds',
      'isActive',
      'subjectIds',
    ]);
    t.isActive = !topic.isActive;
    if (!this.updating) {
      this.updating = true;
      this.topicService.update(topic.id, t).subscribe(
        (resp) => {
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
