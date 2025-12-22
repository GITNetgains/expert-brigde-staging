import { Component, Input } from '@angular/core';

@Component({
  selector: 'toast-sample-icon',
  template: `<svg
    class="rounded me-2"
    width="20"
    height="20"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
    focusable="false"
    role="img"
  >
    <rect width="100%" height="100%" [attr.fill]="getFillColor()"></rect>
  </svg>`,
  standalone: true
})
export class ToastIconComponent {
  @Input() color = 'primary';

  private colorMap: { [key: string]: string } = {
    primary: '#007aff', // Default iOS blue (or use CoreUI's --cui-primary)
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40'
  };

  getFillColor(): string {
    // If color is a known CoreUI theme color, map it; otherwise, use it directly
    return this.colorMap[this.color] || this.color;
  }
}