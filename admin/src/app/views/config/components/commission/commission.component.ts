import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ButtonDirective,
  ContainerComponent,
  FormControlDirective,
  FormSelectDirective,
  GutterDirective,
  InputGroupComponent,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { CurrenciesService } from '@services/currency.service';
import { concatMap, from, Observable } from 'rxjs';

@Component({
  selector: 'app-commission',
  standalone: true,
  templateUrl: './commission.component.html',
  imports: [
    ContainerComponent,
    RowComponent,
    TableDirective,
    InputGroupComponent,
    ButtonDirective,
    FormControlDirective,
    FormsModule,
    FormSelectDirective,
    GutterDirective,
  ],
})
export class CommissionComponent implements OnInit {
  @Input() items: any[] = [];
  @Input() save!: (item: any) => Observable<void>;
  currencies: any[] = [];

  private currencyService = inject(CurrenciesService);

  ngOnInit(): void {
    this.currencies = this.currencyService.getCurrencies();
  }

  changeCurrency(event: any): void {
    const { value } = event.target;
    const currency = this.currencies.find((item) => item.name === value);
    const currencySymbol = (this.items as { key: string; value: any }[]).find(
      (item) => item.key === 'currencySymbol'
    );
    if (currencySymbol) {
      currencySymbol.value =
        currency['symbol-alt-narrow'] || currency['symbol'];
    }
  }

  saveCurrency() {
    const currencyConfigs = this.items.filter(
      (item: any) => item.key === 'currency' || item.key === 'currencySymbol'
    );

    from(currencyConfigs)
      .pipe(concatMap((item) => this.save(item)))
      .subscribe();
  }

  onSave(item: any) {
    if (this.save) {
      this.save(item).subscribe();
    }
  }
}
