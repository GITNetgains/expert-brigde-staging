import { CommonModule, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  BadgeComponent,
  BorderDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardFooterComponent,
  CardHeaderComponent,
  ColComponent,
  FormControlDirective,
  FormLabelDirective,
  GutterDirective,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { RequestRefundService } from '@services/request-refund.service';
import { UtilService } from '@services/util.service';
import { AppConfigService } from '@services/app-config.service';

@Component({
  selector: 'app-detail',
  standalone: true,
  templateUrl: './detail.component.html',
  imports: [
    CommonModule,
    ColComponent,
    RowComponent,
    TableDirective,
    BorderDirective,
    BadgeComponent,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    CardFooterComponent,
    GutterDirective,
    FormLabelDirective,
    FormControlDirective,
    ButtonDirective,
    FormsModule,
  ],
})
export class DetailComponent {
  item: any = {};
  approve = { note: '' };
  reject = { note: '', rejectReason: '' };
  status = '';
  config: any;

  private id: string = '';

  private route = inject(ActivatedRoute);
  private refundService = inject(RequestRefundService);
  private toasty = inject(UtilService);
  private location = inject(Location);
  private appConfigService = inject(AppConfigService);

  ngOnInit(): void {
    this.config = this.appConfigService.getConfig() ?? this.route.snapshot.data['appConfig'];
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.refundService.findOne(this.id).subscribe({
      next: (res: any) => {
        this.item = res.data;
        this.status = res.data.status;
      },
      error: () => {
        this.toasty.toastError({
          message: 'Failed to load refund request',
        });
      },
    });
  }

  approveRequest(): void {
    if (!confirm('Are you sure you want to approve this request?')) return;

    this.refundService.approve(this.id, this.approve).subscribe({
      next: (res: any) => {
        if (res.data.success) {
          this.status = 'approved';
          this.toasty.toastSuccess({
            message: 'Approved successfully',
          });
        }
      },
      error: (err: any) =>
        this.toasty.toastError({
          message: err?.error?.message || 'Error approving',
        }),
    });
  }

  rejectRequest(): void {
    if (!this.reject.rejectReason) {
      return this.toasty.toastError({
        message: 'Please enter reason',
      });
    }

    if (!confirm('Are you sure to reject this refund?')) return;

    this.refundService.reject(this.id, this.reject).subscribe({
      next: (res: any) => {
        if (res.data.success) {
          this.status = 'rejected';
          this.toasty.toastSuccess({
            message: 'Rejected successfully',
          });
        }
      },
      error: (err: any) =>
        this.toasty.toastError({
          message: err?.error?.message || 'Error rejecting',
        }),
    });
  }

  confirm(): void {
    if (!confirm('Are you sure to confirm this refund?')) return;

    this.refundService.confirm(this.id).subscribe({
      next: (res: any) => {
        if (res.data.success) {
          this.status = 'refunded';
          this.toasty.toastSuccess({
            message: 'Confirmed successfully',
          });
          this.location.back();
        }
      },
      error: (err: any) =>
        this.toasty.toastError({
          message: err?.error?.message || 'Error confirming',
        }),
    });
  }
}
