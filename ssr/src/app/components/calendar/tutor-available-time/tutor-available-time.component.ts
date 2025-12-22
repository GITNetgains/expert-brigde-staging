import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ViewChild,
  OnChanges,
  ViewEncapsulation,
  SimpleChanges
} from '@angular/core';
import * as moment from 'moment';

import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarApi, CalendarOptions, DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core';
import { AppointmentService, CalendarService, CartItem, CartService, STATE, StateService } from 'src/app/services';
import { IUser } from 'src/app/interface';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-tutor-available-time',
  templateUrl: 'tutor-available-time.html',
  styleUrls: ['style.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, FullCalendarModule]
})
export class UserAvailableTimeComponent implements OnInit, OnChanges {
  @Input() tutorId: any;
  @Input() timeSelected: any = {};
  @Input() isFree = false;
  @Output() doSelect = new EventEmitter();
  @Output() doAddToCart = new EventEmitter();
  @Input() reschedule = false;
  private startTime;
  private toTime;
  public weekText = '';
  public states: any = {
    active: ''
  };
  public userTimeZone = '';
  public appointments: any;
  public availableTimes: any;
  public calendarEvents: EventInput[] = [];
  public calendarVisible = true;
  public calendarOptions: CalendarOptions = {
    editable: false,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridWeek,timeGridDay'
    },
    initialEvents: [],
    selectable: false,
    initialView: 'timeGridWeek',
    eventOverlap: false,
    locale: 'en',
    // select: this.select.bind(this),
    eventClick: this.onSelectSlot.bind(this),
    eventDidMount: function (info) {
      const { isDisabled } = info.event.extendedProps;
      if (!isDisabled) {
        const element = info.el as any;
        element.querySelector('.fc-event-title').innerHTML =
          '<a class="book-now" style="color: white;" href="javascript:void(0)">' + 'Book now' + '</a>';
      }
    },
    datesSet: this.changeWeek.bind(this),
    //slotDuration: '00:15:00',
    titleFormat: 'DD/MM/YYYY',
    dayHeaderFormat: 'ddd, DD/MM',
    slotDuration: '00:10:00'
  };
  // public currentEvents: EventApi[] = [];
  public calendarApi: CalendarApi;
  public days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  public calendar = {
    Sunday: [],
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    length: 7
  } as any;
  loading = false;
  loadedData = false;
  config: any = {};
  @ViewChild('calendar') calendarComponent: FullCalendarComponent;

  public cartItems: CartItem[] = [];
  currentTutorInCart = '';
  constructor(
    private service: CalendarService,
    private appointmentServie: AppointmentService,
    private cartService: CartService,
    public stateService: StateService
  ) {
    this.startTime = moment().startOf('week').toDate().toISOString();
    this.toTime = moment().endOf('week').toDate().toISOString();
    this.weekText = `${moment(this.startTime).format('DD/MM/YYYY')} - ${moment(this.toTime).format('DD/MM/YYYY')}`;
    this.cartService.model.data$.subscribe(resp => {
      this.cartItems = resp.items;
      this.currentTutorInCart = resp.tutorId;
      if (this.loadedData) {
        this.mappingDataCalendar(this.availableTimes);
      }
    });
    this.config = this.stateService.getState(STATE.CONFIG);
    const currentUser = this.stateService.getState(STATE.CURRENT_USER) as IUser;
    if (currentUser && currentUser._id) {
      this.userTimeZone = currentUser.timezone;
    }
  }

  ngOnInit() {
    if (this.timeSelected && this.timeSelected.startTime) {
      this.addToCart(this.timeSelected);
    }
    // this.cartItems = this.cartService.getItemsInCart('subject');
    this.query();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes.isFree &&
      changes.isFree.previousValue !== undefined &&
      changes.isFree.currentValue !== changes.isFree.previousValue
    ) {
      this.query();
    }
  }

  async query() {
    this.loading = true;
    await Promise.all([
      this.appointmentServie
        .appointmentTutor(this.tutorId, {
          startTime: this.startTime,
          toTime: this.toTime,
          targetType: 'subject',
          status: 'booked,pending',
          isFree: this.isFree
        })
        .then(resp => {
          this.appointments = resp.data.items;
          return this.appointments;
        }),
      this.service
        .search({
          tutorId: this.tutorId,
          startTime: this.startTime,
          toTime: this.toTime,
          take: 10000,
          type: 'subject',
          isFree: this.isFree,
          sort: 'startTime',
          sortType: 'asc'
        })
        .then(resp => {
          this.availableTimes = resp.data.items;
          return this.availableTimes;
        })
    ]);

    // this.mappingData(this.availableTimes);
    this.mappingDataCalendar(this.availableTimes);
    this.loading = false;
    this.loadedData = true;
  }

  // mappingData(items: any) {
  //   if (items.length !== 0) {
  //     items.map(item => {
  //       this.createChunks(item);
  //     });
  //   }
  // }

  mappingDataCalendar(items: any) {
    this.calendar = {
      Sunday: [],
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      length: 7
    };
    if (items.length !== 0) {
      items.map((item: any) => {
        const field = moment(item.startTime).format('dddd');
        this.calendar[field] = this.calendar[field].concat(this.createChunksCalendar(item));
      });
    } else {
      this.calendar.length = 0;
    }
  }

  // createChunks(item: any) {
  //   let startTime = moment(item.startTime).toDate();
  //   let toTime = moment(item.toTime).toDate();
  //   do {
  //     const slot = {
  //       start: startTime,
  //       end: toTime,
  //       backgroundColor: '#e4465a',
  //       item,
  //       isDisabled: false,
  //       title: ''
  //     };
  //     if (moment().add(15, 'minute').isAfter(moment(slot.start))) {
  //       slot.backgroundColor = '#ddd';
  //       slot.isDisabled = true;
  //       slot.title = 'Not available';
  //     }
  //     this.appointments.forEach(appointment => {
  //       if (moment(appointment.startTime).format() === moment(item.startTime).format()) {
  //         slot.backgroundColor = '#ddd';
  //         slot.isDisabled = true;
  //         slot.title = 'Not available';
  //       }
  //     });
  //     this.calendarEvents.push(slot);
  //     startTime = toTime;
  //   } while (moment(startTime).isBefore(item.toTime));
  //   return this.calendarEvents;
  // }

  createChunksCalendar(item: any) {
    const startTime = moment(item.startTime).toDate();
    const toTime = moment(item.toTime).toDate();

    const slot = {
      start: startTime,
      end: toTime,
      backgroundColor: '#e4465a',
      isDisabled: false,
      title: '',
      text: `${moment(startTime).format('HH:mm')} - ${moment(toTime).format('HH:mm')}`,
      available: true,
      addedToCart: false,
      booked: false
    } as any;
    if (moment().add(15, 'minute').isAfter(moment(slot.start)) || item.booked) {
      slot.backgroundColor = '#ddd';
      slot.isDisabled = true;
      slot.title = 'Not available';
      slot.available = false;
      slot.booked = item.booked || false;
    }
    const existedInCart = this.cartItems.find(
      cartItem => moment(cartItem.product.startTime).isSame(slot.start) && this.currentTutorInCart === this.tutorId
    );
    if (existedInCart) {
      slot.addedToCart = true;
      slot.cartItem = existedInCart;
    }

    return slot;
  }

  addToCart(time: any) {
    if (time.addedToCart) {
      return this.cartService.removeItem(time.cartItem);
    }
    this.doAddToCart.emit(time);
  }

  async changeWeek($event: DatesSetArg) {
    this.calendarEvents = [];
    const calendarApi = $event.view.calendar;
    calendarApi.removeAllEvents();
    this.startTime = moment($event.view.activeStart).toDate().toISOString();
    this.toTime = moment($event.view.activeEnd).toDate().toISOString();
    await this.query();
    calendarApi.addEventSource(this.calendarEvents);
  }

  changeWeekCalendar(text: string) {
    const add = text === 'next' ? 1 : -1;
    this.startTime = moment(this.startTime).add(add, 'week').startOf('week').toDate().toISOString();
    this.toTime = moment(this.toTime).add(add, 'week').endOf('week').toDate().toISOString();
    this.weekText = `${moment(this.startTime).format('DD/MM/YYYY')} - ${moment(this.toTime).format('DD/MM/YYYY')}`;
    this.query();
  }

  onSelectSlot($event: EventClickArg) {
    const { isDisabled } = $event.event.extendedProps;
    if (isDisabled) {
      return;
    }
    this.doSelect.emit($event.event);
  }

  selectSlot(time: any) {
    this.doSelect.emit(time);
  }
}
