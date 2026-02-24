import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  BadgeComponent,
  BorderDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { AppointmentService } from '@services/appointment.service';
import { UtilService } from '@services/util.service';
import { AppConfigService } from '@services/app-config.service';
import { pick } from 'lodash-es';

@Component({
  selector: 'app-detail',
  standalone: true,
  templateUrl: './detail.component.html',
  imports: [
    RowComponent,
    ColComponent,
    CommonModule,
    RouterLink,
    CardBodyComponent,
    CardHeaderComponent,
    CardComponent,
    TableDirective,
    BorderDirective,
    BadgeComponent,
  ],
})
export class DetailComponent implements OnInit {
  appointment: any = {};
  config: any;

  private aId: any;

  private route = inject(ActivatedRoute);
  private toasty = inject(UtilService);
  private appointmentService = inject(AppointmentService);
  private appConfigService = inject(AppConfigService);

  ngOnInit(): void {
    this.config = this.appConfigService.getConfig() ?? this.route.snapshot.data['appConfig'];
    this.aId = this.route.snapshot.paramMap.get('id');
    this.appointmentService.findOne(this.aId).subscribe({
      next: (resp) => {
        this.appointment = pick(resp.data, [
          '_id',
          'status',
          'tutor',
          'user',
          'startTime',
          'toTime',
          'subject',
          'recordings',
          'transaction',
          'paid',
          'webinar',
          'targetType',
        ]);
      },
      error: () => {
        this.toasty.toastError({
          title: 'Error',
          message: 'Something went wrong while loading the appointment!',
        });
      },
    });
  }
}
