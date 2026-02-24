import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  BadgeComponent,
  BorderDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardFooterComponent,
  CardHeaderComponent,
  ColComponent,
  ContainerComponent,
  FormControlDirective,
  FormLabelDirective,
  GutterDirective,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { RequestPayoutService } from '@services/request-payout.service';
import { UtilService } from '@services/util.service';
import { AppConfigService } from '@services/app-config.service';

@Component({
  selector: 'app-detail',
  standalone: true,
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    CardFooterComponent,
    TableDirective,
    BorderDirective,
    RouterLink,
    BadgeComponent,
    ButtonDirective,
    FormControlDirective,
    FormLabelDirective,
    GutterDirective,
  ],
})
export class DetailComponent implements OnInit {
  item: any = {};
  info: any = {
    note: '',
    rejectReason: '',
  };
  appointment: any;
  status: string = '';
  config: any;
  action: string = 'approve';

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toasty = inject(UtilService);
  private payoutService = inject(RequestPayoutService);
  private appConfigService = inject(AppConfigService);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.config = this.appConfigService.getConfig() ?? this.route.snapshot.data['appConfig'];

    this.payoutService.findOne(id).subscribe({
      next: (res: any) => {
        this.item = res.data;
        this.status = res.data.status;
        this.appointment = res.data.items?.[0];
      },
      error: () => {
        this.toasty.toastError({
          title: 'Error',
          message: 'Failed to load request payout.',
        });
      },
    });
  }

  reject(item: any): void {
    if (this.status === 'rejected') {
      this.toasty.toastError({
        title: 'Error',
        message: 'This request has been rejected, can not be changed status',
      });
      return;
    }
    if (this.status === 'approved') {
      this.toasty.toastError({
        title: 'Error',
        message: 'This request has been approved, can not be changed status',
      });
      return;
    }
    if (!this.info.rejectReason) {
      this.toasty.toastError({
        title: 'Error',
        message: 'Please enter reason.',
      });
      return;
    }

    this.payoutService
      .reject(item._id, {
        rejectReason: this.info.rejectReason,
        note: this.info.note,
      })
      .subscribe({
        next: () => {
          this.toasty.toastSuccess({
            title: 'Success',
            message: 'Success',
          });
          this.status = 'rejected';
          this.router.navigate(['/payout/request']);
        },
        error: () => {
          this.toasty.toastError({
            title: 'Error',
            message: 'Something went wrong, please try again!',
          });
        },
      });
  }

  approve(item: any): void {
    if (this.status === 'approved') {
      this.toasty.toastError({
        title: 'Error',
        message: 'This request has been approved, can not be changed status',
      });
      return;
    }
    if (this.status === 'rejected') {
      this.toasty.toastError({
        title: 'Error',
        message: 'This request has been rejected, can not be changed status',
      });
      return;
    }

    this.payoutService
      .approve(item._id, {
        note: this.info.note,
      })
      .subscribe({
        next: () => {
          this.toasty.toastSuccess({
            title: 'Success',
            message: 'Success',
          });
          this.status = 'approved';
          this.router.navigate(['/payout/requests']);
        },
        error: () => {
          this.toasty.toastError({
            title: 'Error',
            message: 'Something went wrong, please try again!',
          });
        },
      });
  }
}
