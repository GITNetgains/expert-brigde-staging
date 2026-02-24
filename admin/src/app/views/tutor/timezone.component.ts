import { Component, Input, EventEmitter, Output, OnInit, ViewChild } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, NgModel } from '@angular/forms';
import moment from 'moment-timezone';

@Component({
  selector: 'app-timezone',
  standalone: true,
  imports: [NgSelectModule, FormsModule],
  template: `
    <div>
      <form #f="ngForm">
        <div class="form-group">
        <ng-select
          [items]="tzNames"
          [(ngModel)]="userTz"
          name="timezone"
          #timezoneModel="ngModel"
          placeholder="Select timezone"
          [required]="required"
          bindValue="$this"
          bindLabel="$this"
          [clearable]="true"
          [class]="getSelectClass()"
          (ngModelChange)="timeZoneChanged($event)"
          (blur)="onBlur()"
          >
        </ng-select>
        @if(shouldShowError()) {
        <div class="invalid-feedback d-block">
          Please select a timezone!
        </div>
        }
        </div>
      </form>
    </div>
  `
})
export class TimezoneComponent implements OnInit {
  @Input() userTz: string = '';
  @Input() isSubmitted: boolean = false;
  /** When false, timezone is optional (e.g. admin tutor form). */
  @Input() required: boolean = true;
  @Output() onChange = new EventEmitter<string>();
  @Output() onValidationChange = new EventEmitter<boolean>();
  
  @ViewChild('timezoneModel', { static: false }) timezoneModel!: NgModel;
  
  public tzNames: string[] = [];
  public isValid: boolean = true;
  
  constructor() {
    this.tzNames = moment.tz.names();
  }

  ngOnInit() {
    if (!this.userTz) {
      this.userTz = this.detectUserTimezone();
    }
    
    setTimeout(() => {
      this.onChange.emit(this.userTz);
      this.isValid = this.required ? !!this.userTz : true;
      this.onValidationChange.emit(this.isValid);
    });
  }

  private detectUserTimezone(): string {
    try {
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const normalizedTz = this.normalizeTimezone(detectedTz);
      
      if (this.tzNames.includes(normalizedTz)) {
        return normalizedTz;
      }
      
      const momentGuess = moment.tz.guess();
      const normalizedMomentGuess = this.normalizeTimezone(momentGuess);
      return this.tzNames.includes(normalizedMomentGuess) ? normalizedMomentGuess : 'Asia/Ho_Chi_Minh';
      
    } catch (error) {
      
      try {
        const momentGuess = moment.tz.guess();
        const normalizedMomentGuess = this.normalizeTimezone(momentGuess);
        return this.tzNames.includes(normalizedMomentGuess) ? normalizedMomentGuess : 'Asia/Ho_Chi_Minh';
      } catch (momentError) {
        return 'Asia/Ho_Chi_Minh'; 
      }
    }
  }

  private normalizeTimezone(timezone: string): string {
    const timezoneMap: { [key: string]: string } = {
      'Asia/Saigon': 'Asia/Ho_Chi_Minh',
      'Asia/Calcutta': 'Asia/Kolkata',
      'Europe/Kiev': 'Europe/Kyiv',
      'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
      'America/Catamarca': 'America/Argentina/Catamarca',
      'America/Cordoba': 'America/Argentina/Cordoba',
      'America/Jujuy': 'America/Argentina/Jujuy',
      'America/Mendoza': 'America/Argentina/Mendoza',
      'Pacific/Samoa': 'Pacific/Pago_Pago'
    };

    return timezoneMap[timezone] || timezone;
  }

  public timeZoneChanged(timeZone: string): void {
    if (timeZone) {
      this.userTz = timeZone;
      this.onChange.emit(this.userTz);
    }
    this.validateTimezone();
  }

  public onBlur(): void {
    this.validateTimezone();
  }

  private validateTimezone(): void {
    setTimeout(() => {
      if (this.timezoneModel) {
        this.isValid = this.required ? (this.timezoneModel.valid ?? false) : true;
        this.onValidationChange.emit(this.isValid);
      }
    });
  }

  public shouldShowError(): boolean {
    if (!this.required || !this.timezoneModel) return false;
    
    return (
      (this.timezoneModel.invalid ?? false) &&
      ((this.timezoneModel.dirty ?? false) || (this.timezoneModel.touched ?? false) || this.isSubmitted)
    );
  }

  public getSelectClass(): string {
    if (!this.timezoneModel) return 'my-select';
    
    const baseClass = 'my-select';
    if (this.shouldShowError()) {
      return `${baseClass} is-invalid`;
    }
    return baseClass;
  }
}
