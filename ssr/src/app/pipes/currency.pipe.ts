import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Pipe({ name: 'appCurrency' })
export class AppCurrencyPipe implements PipeTransform {
  constructor(private currencyPipe: CurrencyPipe) {}

  transform(
    value: any,
    currencyCode?: string,
    display?: string | boolean,
    digitsInfo?: string,
    locale?: string
  ): string {
    const currencySymbol = localStorage.getItem('currencySymbol') || '$';

    if (value != null) {
      const formattedValue = this.currencyPipe.transform(
        value,
        currencyCode ?? currencySymbol,
        display,
        digitsInfo,
        locale
      );
      return formattedValue?.replace('.00', '') || '';
    }

    return (
      this.currencyPipe
        ?.transform(0, currencyCode ?? currencySymbol, display, locale)
        ?.split('0.00')[0] || ''
    );
  }
}
