import { Component, inject, OnInit } from '@angular/core';
import {
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  RowComponent,
  Tabs2Module,
} from '@coreui/angular';
import { ConfigService } from '@services/config.service';
import { UtilService } from '@services/util.service';
import { EMPTY, Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CommissionComponent } from '../components/commission/commission.component';
import { GeneralComponent } from '../components/general/general.component';
import { ImageComponent } from '../components/image/image.component';
import { OtherComponent } from '../components/other/other.component';
import { PlatformComponent } from '../components/platform/platform.component';
import { SeoComponent } from '../components/seo/seo.component';
import { SmtpComponent } from '../components/smtp/smtp.component';
import { StripeComponent } from '../components/stripe/stripe.component';
import { ThemeComponent } from '../components/theme/theme.component';
@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.component.html',
  imports: [
    RowComponent,
    ColComponent,
    Tabs2Module,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    GeneralComponent,
    SeoComponent,
    ImageComponent,
    CommissionComponent,
    SmtpComponent,
    StripeComponent,
    PlatformComponent,
    ThemeComponent,
    OtherComponent,
  ],
})
export class ListComponent implements OnInit {
  items: any[] = [];
  groups = [
    'general',
    'seo',
    'image',
    'commission',
    'smtp',
    'stripe',
    'platform',
    'theme',
    'other',
  ];
  activeGroup = 'general';

  private toasty = inject(UtilService);
  private configService = inject(ConfigService);

  ngOnInit(): void {
    this.query();
  }

  query(): void {
    this.configService
      .list({ sort: 'ordering', sortType: 'asc', group: this.activeGroup })
      .subscribe({
        next: (resp) => {
          this.items = resp.data.items;
        },
        error: (err) => {
          console.error(err);
          this.toasty.toastError({
            title: 'Error',
            message: 'Something went wrong, please try again!',
          });
        },
      });
  }

  save(item: any): Observable<void> {
    if (item.type === 'number' && item.value < 0) {
      this.toasty.toastError({
        title: 'Error',
        message: 'Please enter positive number!',
      });
      return EMPTY;
    }
    if (item.key === 'commissionRate' && item.value > 1) {
      this.toasty.toastError({
        title: 'Error',
        message: 'Allowable value from 0 - 1, for example 0.1 = 10%!',
      });
      return EMPTY;
    }
    return this.configService.update(item._id, item.value).pipe(
      tap(() => {
        this.toasty.toastSuccess({
          title: 'Success',
          message: 'Updated successfully!',
        });
      }),
      catchError((e) => {
        this.toasty.toastError({
          title: 'Error',
          message: 'Something went wrong, please try again!',
        });
        return EMPTY;
      }),
      map(() => void 0)
    );
  }

  groupName(group: string): string {
    let name = '';
    switch (group) {
      case 'general':
        name = 'General';
        break;
      case 'seo':
        name = 'SEO';
        break;
      case 'image':
        name = 'Image';
        break;
      case 'commission':
        name = 'Commission';
        break;
      case 'smtp':
        name = 'SMTP';
        break;
      case 'stripe':
        name = 'Stripe';
        break;
      case 'platform':
        name = 'Live classes';
        break;
      case 'theme':
        name = 'Colors';
        break;
      case 'other':
        name = 'Other Settings';
        break;
      default:
        break;
    }
    return name;
  }

  selectGroup(group: string): void {
    this.activeGroup = group;
    this.query();
  }
}
