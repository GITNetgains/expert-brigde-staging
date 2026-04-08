import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CalendarService } from '@services/calendar.service';
import { TutorService } from '@services/tutor.service';
import {
  CardBodyComponent,
  CardComponent,
  CardFooterComponent,
  CardHeaderComponent,
  ColComponent,
  ContainerComponent,
  FormControlDirective,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { AppPaginationComponent } from '@components/index';

@Component({
  selector: 'app-one-on-one-listing',
  standalone: true,
  templateUrl: './one-on-one-list.component.html',
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    CardFooterComponent,
    TableDirective,
    FormControlDirective,
    AppPaginationComponent,
    DatePipe,
  ],
})
export class OneOnOneListComponent implements OnInit {
  public items: any[] = [];
  public total = 0;
  public currentPage = 1;
  public pageSize = 10;
  public tutorId = '';
  public tutors: any[] = [];

  constructor(
    private calendarService: CalendarService,
    private tutorService: TutorService
  ) {}

  ngOnInit(): void {
    this.tutorService.search({ take: 1000 }).subscribe((resp: any) => {
      this.tutors = resp?.data?.items || [];
    });
    this.query();
  }

  query() {
    const params: Record<string, any> = {
      type: 'subject',
      page: this.currentPage,
      take: this.pageSize,
      sort: 'createdAt',
      sortType: 'desc',
    };
    if (this.tutorId) {
      params['tutorId'] = this.tutorId;
    }
    this.calendarService.search(params).subscribe((resp: any) => {
      this.items = resp?.data?.items || [];
      this.total = resp?.data?.count || 0;
    });
  }

  onPageChange(event: any) {
    const page =
      typeof event === 'number'
        ? event
        : parseInt(event.target.value || event.target.innerText, 10);
    this.currentPage = page;
    this.query();
  }

  onTutorChange() {
    this.currentPage = 1;
    this.query();
  }
}
