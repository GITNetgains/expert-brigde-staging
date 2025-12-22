import {
  Component,
  OnInit,
  ViewChild,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import * as moment from 'moment';
import Tooltip from 'tooltip.js';
import {
  FullCalendarComponent,
  FullCalendarModule
} from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import momentPlugin from '@fullcalendar/moment';
import { TranslateService } from '@ngx-translate/core';
import { IUser } from 'src/app/interface';
import { CommonModule } from '@angular/common';
import {
  CalendarApi,
  CalendarOptions,
  EventApi,
  EventClickArg,
  EventInput
} from '@fullcalendar/core';
import {
  AppService,
  CalendarService,
  STATE,
  StateService
} from 'src/app/services';
import { AppointmentService } from 'src/app/services/appointment.service';

@Component({
  selector: 'app-schedule-calendar',
  templateUrl: './schedule.html',
  standalone: true,
  imports: [CommonModule, FullCalendarModule]
})
export class ScheduleEditComponent implements OnInit {
  @Input() webinarId: any;
  @Input() type: string;
  @Input() hashWebinar: string;
  @Input() isFree = false;
  @Input() webinarName: string;
  @Input() slotDuration = 40;
  @Output() doChange = new EventEmitter();
  public today = moment();
  public getMonth = moment().get('month');
  public month = moment().set('month', this.getMonth);
  public events: any = [];
  public currentUser: IUser;
  public tutorTimeZone = '';
  public calendarEvents: EventInput[] = [];
  public calendarVisible = true;
  public appointments: any[];
  public calendarOptions: CalendarOptions = {
    plugins: [
      dayGridPlugin,
      timeGridPlugin,
      listPlugin,
      interactionPlugin,
      momentPlugin
    ],
    editable: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,timeGridDay'
    },
    buttonText: {
      today: 'Today',
      week: 'Week',
      day: 'Day'
    },
    initialEvents: [],
    selectable: true,
    initialView: 'timeGridWeek',
    eventOverlap: false,
    locale: 'en',
    select: this.select.bind(this),
    eventClick: this.eventClick.bind(this),
    eventDidMount: function (info: any) {
      const item = info.event.extendedProps.item;
      if (item.webinarName && item.webinarName.length > 0) {
        info.el.setAttribute('placement', 'top');
        info.el.setAttribute(
          'ngbTooltip',
          info.event.extendedProps.item.webinarName
        );
        const tooltip = new Tooltip(info.el, {
          title: info.event.extendedProps.item.webinarName,
          placement: 'top',
          trigger: 'hover',
          container: info.el
        });
        tooltip.show(); // show the tooltip
        tooltip.hide();
      }
    },
    eventsSet: this.handleEvents.bind(this),
    eventDrop: this.updateEvent.bind(this),
    datesSet: this.loadInitialEvents.bind(this),
    eventResize: this.updateEvent.bind(this),
    eventAllow: this.dragAllow.bind(this),
    longPressDelay: 50,
    eventLongPressDelay: 50,
    selectLongPressDelay: 50,
    titleFormat: 'DD/MM/YYYY',
    dayHeaderFormat: 'ddd, DD/MM',
    slotDuration: '00:10:00'
  };
  public currentEvents: EventApi[] = [];
  public calendarApi: CalendarApi;

  public webinarColors: any = {
    active: '#e4465a',
    otherClass: '#2596be',
    soloClass: '#49be25'
  };

  public soloColors: any = {
    active: '#e4465a',
    groupClass: '#2596be',
    otherType: '#49be25'
  };

  @ViewChild('calendar') calendarComponent: FullCalendarComponent;

  notified = false;
  constructor(
    private calendar: CalendarService,
    private appService: AppService,
    private appointmentServie: AppointmentService,
    private stateService: StateService,
    private translate: TranslateService
  ) {
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
    if (this.currentUser._id) {
      this.tutorTimeZone = this.currentUser.timezone;
    }
  }

  ngOnInit() {
    this.slotDuration =
      typeof this.slotDuration === 'string'
        ? parseInt(this.slotDuration, 10)
        : this.slotDuration;
  }

  handleEvents(events: EventApi[]) {
    this.currentEvents = events;
  }

  dragAllow(dropInfo: any, draggedEvent: any) {
    const { isDisabled } = draggedEvent.extendedProps;
    if (isDisabled) {
      this.appService.toastError('Cannot update this slot!');
      return false;
    }
    const startTime = new Date(dropInfo.start);
    const toTime = new Date(dropInfo.end);
    // const duration = moment.duration((moment(toTime).unix() - moment(startTime).unix()) * 1000);
    const minute = (moment(toTime).unix() - moment(startTime).unix()) / 60;
    if (minute > this.slotDuration) {
      this.appService.toastError(
        `Maximum time allowed is ${this.slotDuration} minutes!`
      );
      return false;
    }
    if (moment().isAfter(startTime)) {
      this.appService.toastError('Cannot update slot in the past!');
      return false;
    }
    return true;
  }

  reRender() {
    this.calendarComponent.getApi().render();
  }

  clearEvents() {
    this.events = [];
  }

  loadStatic() {
    this.calendarEvents = [];
    this.calendarApi.removeAllEvents();
    if (this.currentUser && this.currentUser._id) {
      this.calendar
        .search({
          startTime: moment(this.calendarApi.view.activeStart)
            .toDate()
            .toISOString(),
          toTime: moment(this.calendarApi.view.activeEnd)
            .toDate()
            .toISOString(),
          webinarId: this.webinarId || '',
          take: 10000,
          type: !this.type || this.type === 'subject' ? '' : 'webinar',
          tutorId: this.currentUser._id,
          hashWebinar: this.hashWebinar || ''
        })
        .then(async (resp) => {
          this.events = resp.data.items;
          this.mappingData(this.events);
          this.calendarApi.addEventSource(this.calendarEvents);
        });
    }
  }

  async loadInitialEvents($event: any) {
    this.calendarEvents = [];
    const calendarApi = $event.view.calendar;
    this.calendarApi = calendarApi;
    calendarApi.removeAllEvents();

    if (this.currentUser && this.currentUser._id) {
      if (!this.type || this.type === 'subject') {
        await Promise.all([
          this.appointmentServie
            .appointmentTutor(this.currentUser._id, {
              startTime: moment($event.view.activeStart).toDate().toISOString(),
              toTime: moment($event.view.activeEnd).toDate().toISOString()
            })
            .then((resp: any) => {
              this.appointments = resp.data.items;
              return this.appointments;
            }),
          this.calendar
            .search({
              tutorId: this.currentUser._id,
              startTime: moment($event.view.activeStart).toDate().toISOString(),
              toTime: moment($event.view.activeEnd).toDate().toISOString(),
              take: 10000
            })
            .then((resp) => {
              this.events = resp.data.items;
              return this.events;
            })
        ]);

        this.mappingData(this.events);
        calendarApi.addEventSource(this.calendarEvents);
      } else {
        this.calendar
          .search({
            startTime: moment($event.view.activeStart).toDate().toISOString(),
            toTime: moment($event.view.activeEnd).toDate().toISOString(),
            take: 10000,
            tutorId: this.currentUser._id
          })
          .then(async (resp) => {
            this.events = resp.data.items;
            this.events.forEach((e: any) => {
              let soloClass = false;
              let otherClass = false;
              if (e.type === 'subject') soloClass = true;
              else {
                if (
                  (this.webinarId && e.webinarId === this.webinarId) ||
                  (this.hashWebinar && e.hashWebinar === this.hashWebinar)
                ) {
                  otherClass = false;
                } else {
                  otherClass = true;
                }
              }
              const calendarevent = {
                start: moment(e.startTime).toDate(),
                end: moment(e.toTime).toDate(),
                item: e,
                backgroundColor:
                  !otherClass && !soloClass
                    ? this.webinarColors.active
                    : otherClass
                    ? this.webinarColors.otherClass
                    : this.webinarColors.soloClass,
                title: otherClass
                  ? 'Other group class'
                  : soloClass
                  ? '1 on 1 class'
                  : '',
                isDisabled: otherClass || soloClass ? true : false
              };
              this.calendarEvents.push(calendarevent);
              if (moment().utc().isAfter(moment.utc(calendarevent.start))) {
                calendarevent.backgroundColor = '#ddd';
              }
            });
            calendarApi.addEventSource(this.calendarEvents);
          });
      }
    }
  }

  mappingData(items: any) {
    if (items.length !== 0) {
      items.map((item: any) => {
        this.createChunks(item);
      });
    }
  }

  eventClick($event: EventClickArg) {
    const { isDisabled } = $event.event.extendedProps;
    if (isDisabled) {
      return;
    }
    if (
      window.confirm(
        this.translate.instant('Are you sure to delete this event?')
      )
    ) {
      const item = $event.event.extendedProps.item;
      this.calendar
        .delete(item.id)
        .then(() => {
          $event.event.remove();

          this.appService.toastSuccess('Deleted');
          this.doChange.emit(this.isFree);
        })
        .catch((e) => this.appService.toastError(e));
    }
  }

  updateEvent($event: any) {
    const { isDisabled } = $event.event.extendedProps;
    if (isDisabled) {
      const oldEvent = {
        start: $event.oldEvent.start,
        end: $event.oldEvent.end,
        item: $event.oldEvent.extendedProps.item,
        backgroundColor: $event.oldEvent.backgroundColor,
        title: $event.oldEvent.title
      };

      const calendarApi = $event.view.calendar;
      const item = $event.event.extendedProps.item;
      for (let index = 0; index < this.calendarEvents.length; index++) {
        if (this.calendarEvents[index].item._id === item._id) {
          this.calendarEvents[index] = oldEvent;
        }
      }
      calendarApi.removeAllEvents();
      calendarApi.addEventSource(this.calendarEvents);
      return this.appService.toastError('Cannot update this slot!');
    } else {
      const oldEvent = {
        start: $event.oldEvent.start,
        end: $event.oldEvent.end,
        item: $event.oldEvent.extendedProps.item,
        backgroundColor: $event.oldEvent.backgroundColor
      };

      const calendarApi = $event.view.calendar;
      const item = $event.event.extendedProps.item;
      const startTime = moment($event.event.start).toDate();
      if (moment().isAfter(startTime)) {
        return this.appService.toastError('Cannot update slot in the past!');
      }
      const toTime = moment($event.event.end).toDate();
      this.calendar
        .update(item._id, {
          startTime,
          toTime,
          webinarId: this.webinarId,
          type: this.type || 'subject',
          hashWebinar: this.hashWebinar || ''
        })
        .then(() => {
          const el = {
            start: startTime,
            end: toTime,
            item
          };
          for (let index = 0; index < this.calendarEvents.length; index++) {
            if (this.calendarEvents[index].item._id === item._id) {
              this.calendarEvents[index] = el;
            }
          }
          this.appService.toastSuccess('Updated');
          this.doChange.emit(this.isFree);
        })
        .catch((e) => {
          for (let index = 0; index < this.calendarEvents.length; index++) {
            if (this.calendarEvents[index].item._id === item._id) {
              this.calendarEvents[index] = oldEvent;
            }
          }
          calendarApi.removeAllEvents();
          calendarApi.addEventSource(this.calendarEvents);
          this.appService.toastError(e);
          // this.toasty.error(this.translate.instant((e.data && e.data.data && e.data.data.message) || e.data.message);
        });
    }
  }

  select($event: any) {
    const startTime = moment($event.start).toDate();
    const calendarApi = $event.view.calendar;
    this.calendarApi = calendarApi;

    if (moment().isAfter(startTime)) {
      return this.appService.toastError('Cannot create slot in the past!');
    }
    let toTime = moment($event.end).toDate();
    const minute = (moment(toTime).unix() - moment(startTime).unix()) / 60;
    if (minute > this.slotDuration) {
      return this.appService.toastError(
        `Maximum time allowed is ${this.slotDuration} minutes!`
      );
    }
    if (minute < this.slotDuration) {
      toTime = moment(toTime)
        .add(this.slotDuration - minute, 'minutes')
        .toDate();
    }
    if (
      (this.slotDuration > 40 &&
        !this.notified &&
        window.confirm(
          this.translate.instant(
            'You have opened a 40 + mins slot, make sure you have a pro zoom license to take this class.'
          )
        )) ||
      this.notified ||
      this.slotDuration <= 40
    ) {
      this.notified = true;
      this.calendar
        .create({
          startTime,
          toTime,
          webinarId: this.webinarId || '',
          type: this.type || 'subject',
          hashWebinar: this.hashWebinar || '',
          isFree: this.isFree
        })
        .then((resp) => {
          calendarApi.addEvent({
            item: this.webinarName
              ? Object.assign(resp.data, { webinarName: this.webinarName })
              : resp.data,
            start: startTime,
            end: toTime,
            backgroundColor: '#e4465a'
          });
          this.calendarEvents.push({
            item: this.webinarName
              ? Object.assign(resp.data, { webinarName: this.webinarName })
              : resp.data,
            start: startTime,
            end: toTime
          });
          let message = 'Created successfully';
          if (this.type === 'subject') {
            message =
              this.isFree === false
                ? 'Paid 1 on 1 class created successfully!'
                : 'Free 1 on 1 class created successfully!';
          }
          this.appService.toastSuccess(message);
          this.doChange.emit(this.isFree);
          // this.ucCalendar.fullCalendar('renderEvent', el);
          // this.ucCalendar.fullCalendar('rerenderEvents');
        })
        .catch((e) => this.appService.toastError(e));
    }
  }

  createChunks(item: any) {
    let startTime = moment(item.startTime).toDate();
    const toTime = moment(item.toTime).toDate();
    do {
      const slot = {
        type: item.type,
        start: startTime,
        end: toTime,
        backgroundColor: '#e4465a',
        item,
        isDisabled: false,
        title: '',
        isFree: item.isFree
      };
      if (
        slot.type === 'subject' &&
        moment().utc().add(30, 'minute').isAfter(moment.utc(slot.start))
      ) {
        slot.backgroundColor = '#ddd';
        slot.isDisabled = true;
        slot.title = 'Not available';
      }

      if (slot.type === 'subject' && slot.isFree !== this.isFree) {
        if (moment().utc().add(30, 'minute').isAfter(moment.utc(slot.start)))
          slot.backgroundColor = '#ddd';
        else slot.backgroundColor = this.soloColors.otherType;
        slot.isDisabled = true;
        slot.title = slot.isFree ? 'Free slot' : 'Paid slot';
      }

      if (slot.type === 'subject' && item.booked) {
        slot.backgroundColor = '#ddd';
        slot.isDisabled = true;

        slot.title = item.isFree ? 'Free slot - Booked' : 'Paid slot - Booked';
      }
      if (slot.type === 'webinar') {
        if (moment().utc().add(30, 'minute').isAfter(moment.utc(slot.start)))
          slot.backgroundColor = '#ddd';
        else slot.backgroundColor = this.soloColors.groupClass;
        slot.isDisabled = true;

        slot.title = 'Group class';
      }

      this.calendarEvents.push(slot);
      startTime = toTime;
    } while (moment(startTime).isBefore(item.toTime));
    return this.calendarEvents;
  }
}
