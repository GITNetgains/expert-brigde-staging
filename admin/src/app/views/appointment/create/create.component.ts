import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { CalendarComponent } from '@components/common/calendar/calendar.component';
import { TutorService } from '@services/tutor.service';
import { UtilService } from '@services/util.service';
import { ICalendarPayload } from 'src/interfaces';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  ContainerComponent,
  FormControlDirective,
  FormLabelDirective,
  RowComponent,
} from '@coreui/angular';

@Component({
  selector: 'app-create-one-on-one-session',
  standalone: true,
  templateUrl: './create.component.html',
  imports: [
    FormsModule,
    NgSelectModule,
    CalendarComponent,
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    FormControlDirective,
    FormLabelDirective,
    ButtonDirective,
  ],
})
export class CreateOneOnOneSessionComponent implements OnInit {
  public tutors: any[] = [];
  public selectedTutorId = '';
  public calendarPayload: ICalendarPayload = {
    type: 'subject',
    tutorId: '',
  };

  constructor(
    private tutorService: TutorService,
    private utilService: UtilService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.tutorService.search({ take: 1000 }).subscribe((resp: any) => {
      this.tutors = resp?.data?.items || [];
    });
  }

  onTutorChange(tutorId: string) {
    this.selectedTutorId = tutorId;
    this.calendarPayload = {
      ...this.calendarPayload,
      tutorId: tutorId || '',
      type: 'subject',
    };
  }

  save() {
    if (!this.selectedTutorId) {
      this.utilService.toastError({
        title: 'Validation Error',
        message: 'Please select an expert first.',
      });
      return;
    }
    this.utilService.toastSuccess({
      title: 'Saved',
      message: '1on1 session slots saved successfully.',
    });
    this.router.navigate(['/appointment/list/one-on-one']);
  }
}
