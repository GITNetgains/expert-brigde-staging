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
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-tutor-available-time',
  templateUrl: 'tutor-available-time.html',
  styleUrls: ['style.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, FullCalendarModule, FormsModule]
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
    const slotStart = moment(item.startTime);
    const slotEnd = moment(item.toTime);
    const bookedRanges = (item.bookedRanges || []).map((r: any) => ({
      start: moment(r.startTime),
      end: moment(r.toTime)
    })).sort((a: any, b: any) => a.start.diff(b.start));

    const windows: any[] = [];
    let cursor = slotStart.clone();
    for (const range of bookedRanges) {
      if (cursor.isBefore(range.start)) {
        windows.push({ start: cursor.clone(), end: range.start.clone() });
      }
      if (range.end.isAfter(cursor)) {
        cursor = range.end.clone();
      }
    }
    if (cursor.isBefore(slotEnd)) {
      windows.push({ start: cursor.clone(), end: slotEnd.clone() });
    }
    if (windows.length === 0 && bookedRanges.length === 0) {
      windows.push({ start: slotStart.clone(), end: slotEnd.clone() });
    }

    const slots: any[] = [];
    for (const win of windows) {
      const minute = win.end.diff(win.start, 'minutes');
      const slot = {
        start: win.start.toDate(),
        end: win.end.toDate(),
        backgroundColor: '#e4465a',
        isDisabled: false,
        title: '',
        text: win.start.format('HH:mm') + ' - ' + win.end.format('HH:mm'),
        available: true,
        addedToCart: false,
        booked: false,
        durationMinutes: minute,
        selectedStartTime: null as any,
        selectedDuration: null as any,
        startTimeOptions: [] as any[],
        durationOptions: [] as any[]
      } as any;

      if (moment().add(5, 'minute').isAfter(moment(slot.start)) || minute < 30) {
        slot.backgroundColor = '#ddd';
        slot.isDisabled = true;
        slot.title = minute < 30 ? 'Minimum 30 mins' : 'Not available';
        slot.available = false;
      } else {
        for (let d = 30; d <= minute; d += 30) {
          const h = Math.floor(d / 60);
          const m = d % 60;
          let label = '';
          if (h === 0) { label = d + ' min'; }
          else if (m === 0) { label = h + (h === 1 ? ' hr' : ' hrs'); }
          else { label = h + ' hr ' + m + ' min'; }
          slot.durationOptions.push({ value: d, label: label });
        }
        let t = win.start.clone();
        while (t.clone().add(30, 'minutes').isSameOrBefore(win.end)) {
          slot.startTimeOptions.push({
            value: t.toISOString(),
            label: t.format('HH:mm')
          });
          t.add(30, 'minutes');
        }
        if (slot.startTimeOptions.length > 0) {
          slot.selectedStartTime = slot.startTimeOptions[0].value;
        }
        if (slot.durationOptions.length > 0) {
          slot.selectedDuration = slot.durationOptions[0].value;
        }
      }

      const existedInCart = this.cartItems.find(
        (cartItem: any) => moment(cartItem.product.startTime).isSame(slot.start) && this.currentTutorInCart === this.tutorId
      );
      if (existedInCart) {
        slot.addedToCart = true;
        slot.cartItem = existedInCart;
      }
      slots.push(slot);
    }

    for (const range of bookedRanges) {
      slots.push({
        start: range.start.toDate(),
        end: range.end.toDate(),
        backgroundColor: '#ddd',
        isDisabled: true,
        title: '',
        text: range.start.format('HH:mm') + ' - ' + range.end.format('HH:mm'),
        available: false,
        addedToCart: false,
        booked: true,
        durationMinutes: 0,
        selectedStartTime: null,
        selectedDuration: null,
        startTimeOptions: [],
        durationOptions: []
      });
    }

    slots.sort((a: any, b: any) => moment(a.start).diff(moment(b.start)));
    return slots;
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

  onDurationChange(time: any) {
    const windowEnd = moment(time.end);
    const duration = time.selectedDuration;
    time.startTimeOptions = [];
    let t = moment(time.start);
    while (t.clone().add(duration, 'minutes').isSameOrBefore(windowEnd)) {
      time.startTimeOptions.push({
        value: t.toISOString(),
        label: t.format('HH:mm')
      });
      t.add(30, 'minutes');
    }
    if (time.startTimeOptions.length > 0) {
      const found = time.startTimeOptions.find((o: any) => o.value === time.selectedStartTime);
      if (!found) {
        time.selectedStartTime = time.startTimeOptions[0].value;
      }
    }
  }

  getEndForStart(time: any, startValue: string): string {
    return moment(startValue).add(time.selectedDuration, 'minutes').format('HH:mm');
  }

  bookWithDuration(time: any) {
    const bookingTime = {
      start: new Date(time.selectedStartTime),
      end: moment(time.selectedStartTime).add(time.selectedDuration, 'minutes').toDate()
    };
    this.doSelect.emit(bookingTime);
  }

  addToCartWithDuration(time: any) {
    if (time.addedToCart) {
      return this.cartService.removeItem(time.cartItem);
    }
    const bookingTime = {
      start: new Date(time.selectedStartTime),
      end: moment(time.selectedStartTime).add(time.selectedDuration, 'minutes').toDate(),
      addedToCart: false,
      cartItem: null
    };
    this.doAddToCart.emit(bookingTime);
  }
}
