import { Component, forwardRef, Input } from '@angular/core';

import {
  ToastBodyComponent,
  ToastCloseDirective,
  ToastComponent,
  ToastHeaderComponent,
} from '@coreui/angular';
import { ToastIconComponent } from './toast-icon.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styles: [
    `
      :host {
        display: block;
        overflow: hidden;
      }
    `,
  ],
  providers: [
    {
      provide: ToastComponent,
      useExisting: forwardRef(() => AppToastComponent),
    },
  ],
  standalone: true,
  imports: [
    CommonModule,
    ToastHeaderComponent,
    ToastIconComponent,
    ToastBodyComponent,
    ToastCloseDirective,
  ],
})
export class AppToastComponent extends ToastComponent {
  constructor() {
    super();
  }

  @Input() closeButton = true;
  @Input() title = null;
  @Input() message = '';
  @Input() colorIcon = 'danger';
}
