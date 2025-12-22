import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';
import * as moment from 'moment-timezone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-timezone',
  template: `
    <div>
      <form #f="ngForm">
        <div class="form-group">
          <select
            class="form-control"
            name="timezone"
            [(ngModel)]="userTz"
            (ngModelChange)="timeZoneChanged($event)"
          >
            <option *ngFor="let tz of tzNames" [value]="tz">{{ tz }}</option>
          </select>
        </div>
      </form>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TimezoneComponent implements OnInit {
  @Input() userTz = 'Asia/Ho_Chi_Minh';
  @Output() timezoneChange = new EventEmitter();
  public tzNames: string[];
  public selectedTz: string;

  constructor() {
    this.tzNames = moment.tz.names();
  }

  ngOnInit() {
    if (!this.userTz) {
      this.userTz = moment.tz.guess();
      if (this.userTz === 'Asia/Calcutta') {
        this.userTz = 'Asia/Kolkata';
      } else if (this.userTz === 'Asia/Saigon') {
        this.userTz = 'Asia/Ho_Chi_Minh';
      }
    }
    this.timeZoneChanged(this.userTz);
  }

  public timeZoneChanged(timeZone: string): void {
    this.userTz = timeZone;
    this.timezoneChange.emit(this.userTz);
  }
}
