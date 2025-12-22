import { Component, Input, OnDestroy, ViewEncapsulation } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-loading',
  template: `<div *ngIf="loading" class="d-flex justify-content-center p-5 app-loading">
    <div class="spinner-border" role="status">
      <span class="sr-only">Loading...</span>
    </div>
  </div>`,
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [NgIf]
})
export class LoadingComponent implements OnDestroy {
  @Input() loading = false;

  ngOnDestroy(): void {
    this.loading = false;
  }
}
