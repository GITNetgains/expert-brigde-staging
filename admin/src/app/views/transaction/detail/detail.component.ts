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
import { TransactionService } from '@services/transaction.service';
import { UtilService } from '@services/util.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-detail',
  standalone: true,
  templateUrl: './detail.component.html',
  imports: [
    CommonModule,
    ColComponent,
    RowComponent,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    TableDirective,
    BorderDirective,
    RouterLink,
    BadgeComponent,
  ],
})
export class DetailComponent implements OnInit {
  transaction: any = {};
  tId: string | null = null;
  config: any;

  private route = inject(ActivatedRoute);
  private toasty = inject(UtilService);
  private transactionService = inject(TransactionService);

  ngOnInit(): void {
    this.config = this.route.snapshot.data['appConfig'];
    this.tId = this.route.snapshot.paramMap.get('id');
    if (this.tId) {
      this.transactionService
        .findOne(this.tId)
        .pipe(take(1))
        .subscribe({
          next: (resp: any) => {
            if (!resp.data) {
              this.transaction = null;
            } else {
              this.transaction = resp.data;
            }
          },
          error: () => {
            this.toasty.toastError({
              title: 'Error',
              message: 'Failed to load transaction details',
            });
          },
        });
    }
  }
}
