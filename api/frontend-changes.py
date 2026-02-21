import sys

# ============================================
# FRONTEND CHANGES FOR SLOT DURATION FLEXIBILITY
# ============================================
# Files modified:
# 1. tutor-available-time.component.ts - Duration picker logic
# 2. tutor-available-time.html - Duration picker UI
# 3. style.scss - Duration picker styles
# 4. booking.component.ts - Pro-rated pricing
# 5. booking.html - /Slot -> /Hour
# ============================================

# ============================================
# FIX 1: tutor-available-time.component.ts
# ============================================
filepath1 = '/home/ubuntu/expertbridge/ssr/src/app/components/calendar/tutor-available-time/tutor-available-time.component.ts'
with open(filepath1, 'r') as f:
    content1 = f.read()

with open(filepath1 + '.backup.flex.20260220', 'w') as f:
    f.write(content1)

# Fix 1a: Add FormsModule import
old_import = "import { CommonModule } from '@angular/common';"
new_import = "import { CommonModule } from '@angular/common';\nimport { FormsModule } from '@angular/forms';"
if old_import in content1:
    content1 = content1.replace(old_import, new_import)
    print("FIX 1a APPLIED: Added FormsModule import")
else:
    print("WARNING: Could not find CommonModule import")

# Fix 1b: Add FormsModule to imports array
old_imports = "imports: [CommonModule, FullCalendarModule]"
new_imports = "imports: [CommonModule, FullCalendarModule, FormsModule]"
if old_imports in content1:
    content1 = content1.replace(old_imports, new_imports)
    print("FIX 1b APPLIED: Added FormsModule to imports array")
else:
    print("WARNING: Could not find imports array")

# Fix 1c: Replace createChunksCalendar method
old_create = """  createChunksCalendar(item: any) {
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
    const minute = (moment(toTime).unix() - moment(startTime).unix()) / 60;
    if (moment().add(5, 'minute').isAfter(moment(slot.start)) || item.booked || minute < 60) {
      slot.backgroundColor = '#ddd';
      slot.isDisabled = true;
      slot.title = minute < 60 ? 'Minimum 60 mins' : 'Not available';
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
  }"""

new_create = """  createChunksCalendar(item: any) {
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

      if (moment().add(5, 'minute').isAfter(moment(slot.start)) || minute < 60) {
        slot.backgroundColor = '#ddd';
        slot.isDisabled = true;
        slot.title = minute < 60 ? 'Minimum 60 mins' : 'Not available';
        slot.available = false;
      } else {
        for (let d = 60; d <= minute; d += 30) {
          const hrs = d / 60;
          slot.durationOptions.push({
            value: d,
            label: hrs === 1 ? '1 hour' : hrs + ' hours'
          });
        }
        let t = win.start.clone();
        while (t.clone().add(60, 'minutes').isSameOrBefore(win.end)) {
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
  }"""

if old_create in content1:
    content1 = content1.replace(old_create, new_create)
    print("FIX 1c APPLIED: Replaced createChunksCalendar with split-window logic")
else:
    print("WARNING: Could not find createChunksCalendar method")

# Fix 1d: Add new methods before class closing brace
old_end = """  selectSlot(time: any) {
    this.doSelect.emit(time);
  }
}"""

new_end = """  selectSlot(time: any) {
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
}"""

if old_end in content1:
    content1 = content1.replace(old_end, new_end)
    print("FIX 1d APPLIED: Added onDurationChange, bookWithDuration, addToCartWithDuration methods")
else:
    print("WARNING: Could not find selectSlot + closing brace")

with open(filepath1, 'w') as f:
    f.write(content1)


# ============================================
# FIX 2: tutor-available-time.html
# ============================================
filepath2 = '/home/ubuntu/expertbridge/ssr/src/app/components/calendar/tutor-available-time/tutor-available-time.html'
with open(filepath2, 'r') as f:
    content2 = f.read()

with open(filepath2 + '.backup.flex.20260220', 'w') as f:
    f.write(content2)

old_li = """                <li *ngFor="let time of calendar[day]">
                  <div class="slot-box bg-color-default" [ngClass]="time.booked || time.isDisabled ? 'booked':''">
                    <p>{{ time.text }}</p>
                    <p *ngIf="time.booked" class="slot-booked">Booked</p>
                    <p *ngIf="time.isDisabled" class="slot-booked">Unavailable</p>
                    <ng-container *ngIf="stateService.showBooking() && !reschedule">
                      <button
                        *ngIf="!time.booked && !time.isDisabled && !isFree"
                        class="btn btn-default btn-sm btn-slot btn-block"
                        type="button"
                        (click)="addToCart(time)"
                        [ngClass]="{'btn-default': !time.addedToCart, 'btn-success': time.addedToCart }"
                      >
                        <i class="fas fa-cart-plus" *ngIf="!time.addedToCart"></i>
                        <span *ngIf="time.addedToCart">Added</span>
                      </button>
                      <button
                        *ngIf="!time.booked && !time.isDisabled"
                        class="btn btn-default btn-sm btn-buy-now btn-block"
                        type="button"
                        (click)="selectSlot(time)"
                      >
                        Book now
                      </button>
                    </ng-container>
                    <button
                      *ngIf="!time.booked && !time.isDisabled && reschedule"
                      class="btn btn-default btn-sm btn-buy-now btn-block"
                      type="button"
                      (click)="selectSlot(time)"
                    >
                      Select
                    </button>
                  </div>
                </li>"""

new_li = """                <li *ngFor="let time of calendar[day]">
                  <div class="slot-box bg-color-default" [ngClass]="time.booked || time.isDisabled ? 'booked':''">
                    <p>{{ time.text }}</p>
                    <p *ngIf="time.booked" class="slot-booked">Booked</p>
                    <p *ngIf="time.isDisabled && !time.booked" class="slot-booked">Unavailable</p>

                    <ng-container *ngIf="!time.booked && !time.isDisabled">
                      <div class="duration-picker" *ngIf="time.durationOptions?.length > 1">
                        <select [(ngModel)]="time.selectedDuration" (ngModelChange)="onDurationChange(time)" class="form-select form-select-sm dp-select">
                          <option *ngFor="let opt of time.durationOptions" [ngValue]="opt.value">{{opt.label}}</option>
                        </select>
                        <select *ngIf="time.startTimeOptions?.length > 1" [(ngModel)]="time.selectedStartTime" class="form-select form-select-sm dp-select">
                          <option *ngFor="let opt of time.startTimeOptions" [value]="opt.value">{{opt.label}} - {{getEndForStart(time, opt.value)}}</option>
                        </select>
                      </div>

                      <ng-container *ngIf="stateService.showBooking() && !reschedule">
                        <button
                          *ngIf="!isFree"
                          class="btn btn-default btn-sm btn-slot btn-block"
                          type="button"
                          (click)="time.durationOptions?.length > 1 ? addToCartWithDuration(time) : addToCart(time)"
                          [ngClass]="{'btn-default': !time.addedToCart, 'btn-success': time.addedToCart }"
                        >
                          <i class="fas fa-cart-plus" *ngIf="!time.addedToCart"></i>
                          <span *ngIf="time.addedToCart">Added</span>
                        </button>
                        <button
                          class="btn btn-default btn-sm btn-buy-now btn-block"
                          type="button"
                          (click)="time.durationOptions?.length > 1 ? bookWithDuration(time) : selectSlot(time)"
                        >
                          Book now
                        </button>
                      </ng-container>
                      <button
                        *ngIf="reschedule"
                        class="btn btn-default btn-sm btn-buy-now btn-block"
                        type="button"
                        (click)="time.durationOptions?.length > 1 ? bookWithDuration(time) : selectSlot(time)"
                      >
                        Select
                      </button>
                    </ng-container>
                  </div>
                </li>"""

if old_li in content2:
    content2 = content2.replace(old_li, new_li)
    print("FIX 2 APPLIED: tutor-available-time.html - duration picker UI")
else:
    print("WARNING: Could not find slot list HTML")

with open(filepath2, 'w') as f:
    f.write(content2)


# ============================================
# FIX 3: style.scss - Duration picker styles
# ============================================
filepath3 = '/home/ubuntu/expertbridge/ssr/src/app/components/calendar/tutor-available-time/style.scss'
with open(filepath3, 'r') as f:
    content3 = f.read()

with open(filepath3 + '.backup.flex.20260220', 'w') as f:
    f.write(content3)

css_addition = """

.duration-picker {
  margin: 4px 0;
  .dp-select {
    font-size: 11px;
    padding: 2px 4px;
    height: auto;
    margin-bottom: 3px;
    color: #333;
    background-color: rgba(255,255,255,0.9);
    border: 1px solid rgba(255,255,255,0.5);
    border-radius: 4px;
    &:focus {
      outline: none;
      border-color: #fff;
    }
  }
}
"""

content3 = content3.rstrip() + css_addition

with open(filepath3, 'w') as f:
    f.write(content3)
print("FIX 3 APPLIED: style.scss - duration picker styles")


# ============================================
# FIX 4: booking.component.ts - Pro-rated pricing
# ============================================
filepath4 = '/home/ubuntu/expertbridge/ssr/src/app/modules/tutor/booking/booking.component.ts'
with open(filepath4, 'r') as f:
    content4 = f.read()

with open(filepath4 + '.backup.flex.20260220', 'w') as f:
    f.write(content4)

# Fix 4a: Pro-rate price in chooseSlot cart update
old_cart = """    this.cartService.updateCart({
      product: {
        ...this.timeSelected,
        targetId: this.booking.targetId,
        targetInfo: {
          name: this.subject?.name
        }
      },
      quantity: 1,
      price:
        !this.usedCoupon && this.appliedCoupon ? this.salePrice : this.price,
      originalPrice: this.price,"""

new_cart = """    const durationHours = (moment(time.end).unix() - moment(time.start).unix()) / 3600;
    const proRatedOriginal = Math.round(this.price * durationHours * 100) / 100;
    const proRatedSale = Math.round(this.salePrice * durationHours * 100) / 100;
    this.cartService.updateCart({
      product: {
        ...this.timeSelected,
        targetId: this.booking.targetId,
        targetInfo: {
          name: this.subject?.name
        }
      },
      quantity: 1,
      price:
        !this.usedCoupon && this.appliedCoupon ? proRatedSale : proRatedOriginal,
      originalPrice: proRatedOriginal,"""

if old_cart in content4:
    content4 = content4.replace(old_cart, new_cart)
    print("FIX 4a APPLIED: booking.component.ts chooseSlot() pro-rated pricing")
else:
    print("WARNING: Could not find cart update in chooseSlot")

# Fix 4b: Pro-rate price in confirm modal
old_modal = """    modalStripe.componentInstance.price = modalStripe.componentInstance.price =
      this.appliedCoupon ? this.salePrice : this.price;"""

new_modal = """    const bookingDurationHours = (moment(this.timeSelected.toTime).unix() - moment(this.timeSelected.startTime).unix()) / 3600;
    modalStripe.componentInstance.price = Math.round((this.appliedCoupon ? this.salePrice : this.price) * bookingDurationHours * 100) / 100;"""

if old_modal in content4:
    content4 = content4.replace(old_modal, new_modal)
    print("FIX 4b APPLIED: booking.component.ts bookingAppointment() pro-rated modal price")
else:
    print("WARNING: Could not find modal price in bookingAppointment")

with open(filepath4, 'w') as f:
    f.write(content4)


# ============================================
# FIX 5: booking.html - /Slot -> /Hour
# ============================================
filepath5 = '/home/ubuntu/expertbridge/ssr/src/app/modules/tutor/booking/booking.html'
with open(filepath5, 'r') as f:
    content5 = f.read()

with open(filepath5 + '.backup.flex.20260220', 'w') as f:
    f.write(content5)

old_slot1 = """{{price | appCurrency }}/<span translate>Slot</span>"""
new_slot1 = """{{price | appCurrency }}/<span translate>Hour</span>"""

old_slot2 = """{{(salePrice ? salePrice : 0) | appCurrency}}/<span translate>Slot</span>"""
new_slot2 = """{{(salePrice ? salePrice : 0) | appCurrency}}/<span translate>Hour</span>"""

if old_slot1 in content5:
    content5 = content5.replace(old_slot1, new_slot1)
    print("FIX 5a APPLIED: booking.html /Slot -> /Hour (regular price)")
else:
    print("WARNING: Could not find /Slot label (regular)")

if old_slot2 in content5:
    content5 = content5.replace(old_slot2, new_slot2)
    print("FIX 5b APPLIED: booking.html /Slot -> /Hour (sale price)")
else:
    print("WARNING: Could not find /Slot label (sale)")

with open(filepath5, 'w') as f:
    f.write(content5)


print("\nAll frontend changes complete!")
