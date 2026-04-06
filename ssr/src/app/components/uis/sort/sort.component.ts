import { CommonModule } from '@angular/common';
import { Component, Input, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-sort',
  templateUrl: './sort.html',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  encapsulation: ViewEncapsulation.None
})
export class SortComponent {
  @Input() sortOption: { [key: string]: string };
  @Input() sortBy: string;
  @Output() doSort = new EventEmitter();
  @Input() sortTitle: string;

  toggle() {
    if (this.sortOption.sortBy === this.sortBy) {
      const nextType = this.sortOption.sortType === 'asc' ? 'desc' : 'asc';
      this.sort(this.sortBy, nextType);
    } else {
      this.sort(this.sortBy, 'asc');
    }
  }

  sort(field: string, type: string) {
    this.sortOption.sortBy = field;
    this.sortOption.sortType = type;
    this.doSort.emit(this.sortOption);
  }
}
