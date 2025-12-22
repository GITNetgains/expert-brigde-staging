import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status',
  template: `<span class="label label-light-primary" *ngIf="status === 'booked'" translate>Booked</span>
    <span class="label label-light-warning" *ngIf="status === 'pending'" translate>Pending</span>
    <span class="label label-light-danger" *ngIf="status === 'canceled'" translate>Canceled</span>
    <span class="label label-light-primary" *ngIf="status === 'progressing'" translate>In Progress</span>
    <span class="label label-light-primary" *ngIf="status === 'completed'" translate>Completed</span>
    <span class="label label-light-dark" *ngIf="status === 'not-start'" translate>Didn't start</span>

    <span class="label label-light-primary" *ngIf="status === 'approved'" translate>Approved</span>
    <span class="label label-light-primary" *ngIf="status === 'refunded'" translate>Refunded</span>
    <span class="label label-light-danger" *ngIf="status === 'rejected'" translate>Rejected</span>`,
  standalone: true,
  imports: [CommonModule]
})
export class StatusComponent {
  @Input() status: string;
}
