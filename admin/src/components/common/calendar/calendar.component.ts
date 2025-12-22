import { Component, signal, ChangeDetectorRef, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventApi, EventInput, DateSpanApi, DatesSetArg, EventDropArg } from '@fullcalendar/core';
import interactionPlugin, { EventResizeDoneArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import moment from 'moment';
import { ICalendarPayload, ISchedule } from 'src/interfaces';
import { CalendarService } from '@services/calendar.service';
import { SpinnerComponent } from '@coreui/angular';
import { UtilService } from '@services/util.service';

const mainColor = {
  subject: '#e4465a',
  webinar: '#4a90e2',
  default: '#ddd'
} as Record<string, string>;

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, SpinnerComponent],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit {
  @Input() payload: ICalendarPayload = {
    type: 'subject',
    tutorId: ''
  }

  calendarVisible = signal(true);
  calendarOptions = signal<CalendarOptions>({
    plugins: [
      interactionPlugin,
      dayGridPlugin,
      timeGridPlugin,
      listPlugin,
    ],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,timeGridDay'
    },
    initialView: 'timeGridWeek',
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    locale: 'local',
    longPressDelay: 50,
    eventLongPressDelay: 50,
    selectLongPressDelay: 50,
    slotDuration: '00:10:00',
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventsSet: this.handleEvents.bind(this),
    eventResize: this.handelUpdateEvent.bind(this),
    eventAllow: this.dragAllow.bind(this),
    selectAllow: this.dragAllow.bind(this),
    datesSet: this.loadEvents.bind(this),
    eventDrop: this.handelUpdateEvent.bind(this),
  });
  currentEvents = signal<EventApi[]>([]);
  loading = signal(false);
  slotDuration = 40; // Default slot duration

  readonly utilService = inject(UtilService);

  constructor(private changeDetector: ChangeDetectorRef, private calendarService: CalendarService) {
  }

  ngOnInit(): void {
  }

  loadEvents(arg: DatesSetArg) {
    this.loading.set(true);
    const params = {
      tutorId: this.payload.tutorId,
      startTime: moment(arg.view.activeStart).toDate().toISOString(),
      toTime: moment(arg.view.activeEnd).toDate().toISOString(),
      take: 1000
    } as Record<string, any>;
    if (this.payload.type) {
      params['type'] = this.payload.type;
    }
    if (this.payload.webinarId) {
      params['webinarId'] = this.payload.webinarId;
    }
    if (this.payload.hashWebinar) {
      params['hashWebinar'] = this.payload.hashWebinar;
    }
    this.calendarService
      .search(params)
      .subscribe((resp) => {
        const events = this.mapEvents(resp.data.items);
        this.calendarOptions.update((options) => ({
          ...options,
          events: events,
        }));
        this.changeDetector.detectChanges();
        this.loading.set(false);
      })
  }

  mapEvents(schedules: ISchedule[]): EventInput[] {
    return schedules.map((schedule) => ({
      id: schedule._id,
      title: schedule.type === 'webinar' ? schedule.webinarName || 'Webinar' : 'Subject',
      start: moment(schedule.startTime).toDate(),
      end: moment(schedule.toTime).toDate(),
      allDay: false,
      backgroundColor: schedule.booked || schedule.disabled ? mainColor['default'] : mainColor[schedule.type],
      extendedProps: {
        ...schedule
      }
    }) as EventInput);
  }


  dragAllow(span: DateSpanApi, _: any) {
    return moment(span.start).isAfter(moment());
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); // clear date selection
    const startTime = moment(selectInfo.start).toDate();
    let toTime = moment(selectInfo.end).toDate();
    const minute = (moment(toTime).unix() - moment(startTime).unix()) / 60;
    if (minute > this.slotDuration) {
      return this.utilService.toastWarning({
        title: 'Invalid Slot Duration',
        message: `The selected slot duration is ${minute} minutes, which exceeds the allowed duration of ${this.slotDuration} minutes.`,
      })
    };
    if (minute < this.slotDuration) {
      toTime = moment(toTime)
        .add(this.slotDuration - minute, 'minutes')
        .toDate();
    }

    const params = {
      startTime,
      toTime,
      tutorId: this.payload.tutorId,
      type: this.payload.type || 'subject',
    } as Record<string, any>;

    if (this.payload.webinarId) {
      params['webinarId'] = this.payload.webinarId;
    }
    if (this.payload.hashWebinar) {
      params['hashWebinar'] = this.payload.hashWebinar;
    }
    this.loading.set(true);
    this.calendarService.create(params).subscribe({
      next: (resp) => {
        this.loading.set(false);
        if (resp.data) {
          this.utilService.toastSuccess({
            title: 'Event Created',
            message: `The event has been successfully created for ${moment(startTime).format('YYYY-MM-DD HH:mm')}.`,
          });
          calendarApi.addEvent({
            id: resp.data._id,
            backgroundColor: mainColor[resp.data.type || 'default'],
            title: this.payload.type === 'webinar' ? resp.data.webinarName || 'Webinar' : 'Subject',
            start: startTime,
            end: toTime,
            extendedProps: {
              ...resp.data,
            }
          });
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.utilService.toastError({
          title: 'Error',
          message: 'Failed to create the event. Please try again later.',
        });
      }
    });
  }

  handleEventClick(clickInfo: EventClickArg) {
    const schedule = clickInfo.event.extendedProps as ISchedule;
    if (schedule.disabled || schedule.booked) {
      return this.utilService.toastWarning({
        title: 'Event Unavailable',
        message: `This slot is ${schedule.disabled ? 'disabled' : 'booked'} and cannot be modified.`,
      });
    }
    if (confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
      this.loading.set(true);
      this.changeDetector.detectChanges(); // workaround for pressionChangedAfterItHasBeenCheckedError
      this.calendarService.remove(schedule._id).subscribe({
        next: (resp) => {
          if (resp.data) {
            if (resp.data.success) {
              clickInfo.event.remove();
              this.utilService.toastSuccess({
                title: 'Event Deleted',
                message: `The event '${clickInfo.event.title}' has been successfully deleted.`,
              });
            }
            this.loading.set(false);
          } else {
            this.utilService.toastError({
              title: 'Error',
              message: 'Failed to delete the event. Please try again later.',
            });
            this.loading.set(false);
          }
        },
        error: (err) => {
          console.error('Error deleting event:', err);
          this.utilService.toastError({
            title: 'Error',
            message: 'Failed to delete the event. Please try again later.',
          });
          this.loading.set(false);
        }
      });
    }
  }

  handleEvents(events: EventApi[]) {
    this.currentEvents.set(events);
    this.changeDetector.detectChanges();
  }

  handelUpdateEvent(event: EventResizeDoneArg | EventDropArg) {
    const schedule = event.event.extendedProps as ISchedule;
    if (schedule.disabled || schedule.booked) {
      event.revert();
      return this.utilService.toastWarning({
        title: 'Event Unavailable',
        message: `This slot is ${schedule.disabled ? 'disabled' : 'booked'} and cannot be modified.`,
      });
    }
    const params = {
      startTime: moment(event.event.start).toDate().toISOString(),
      toTime: moment(event.event.end).toDate().toISOString(),
      type: this.payload.type || 'subject',
      tutorId: this.payload.tutorId,
    } as Record<string, any>;
    if (this.payload.webinarId) {
      params['webinarId'] = this.payload.webinarId;
    }
    if (this.payload.hashWebinar) {
      params['hashWebinar'] = this.payload.hashWebinar;
    }
    this.calendarService.update(schedule._id, {
      startTime: moment(event.event.start).toDate().toISOString(),
      toTime: moment(event.event.end).toDate().toISOString(),
      type: this.payload.type || 'subject',
      webinarId: this.payload.webinarId,
      hashWebinar: this.payload.hashWebinar,
    }).subscribe({
      next: (resp) => {
        if (resp.data) {
          this.utilService.toastSuccess({
            title: 'Event Updated',
            message: `The event '${event.event.title}' has been successfully updated.`,
          });
        } else {
          this.utilService.toastError({
            title: 'Error',
            message: 'Failed to update the event. Please try again later.',
          });
          event.revert();
        }
      }
      ,
      error: (err) => {
        console.error('Error updating event:', err);
        this.utilService.toastError({
          title: 'Error',
          message: 'Failed to update the event. Please try again later.',
        });
        event.revert();
      }
    });
    this.changeDetector.detectChanges(); // workaround for pressionChangedAfterItHasBeenCheckedError
  }
}