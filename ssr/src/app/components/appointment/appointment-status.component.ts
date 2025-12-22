import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-appointment-status',
  template: `<span class="label label-light-primary" *ngIf="status === 'booked'" translate>Booked</span>
    <span class="label label-light-warning" *ngIf="status === 'pending'" translate>Pending</span>
    <span class="label label-light-danger" *ngIf="status === 'canceled'" translate>Canceled</span>
    <span class="label label-light-primary" *ngIf="status === 'progressing'" translate>In Progress</span>
    <span class="label label-light-primary" *ngIf="status === 'completed'" translate>Completed</span>
    <span class="label label-light-dark" *ngIf="status === 'not-start'" translate>Didn't start</span>`,
  standalone: true,
  imports: [NgIf]
})
export class AppointmentStatusComponent {
  @Input() status: string;
}
