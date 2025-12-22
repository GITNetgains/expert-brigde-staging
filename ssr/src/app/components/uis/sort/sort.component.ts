import { CommonModule } from '@angular/common';
import { Component, Input, EventEmitter, Output } from '@angular/core';
@Component({
  selector: 'app-sort',
  templateUrl: './sort.html',
  standalone: true,
  imports: [CommonModule]
})
export class SortComponent {
  @Input() sortOption: { [key: string]: string };
  @Input() sortBy: string;
  @Output() doSort = new EventEmitter();
  @Input() sortTitle: string;

  sort(field: string, type: string) {
    this.sortOption.sortBy = field;
    this.sortOption.sortType = type;
    this.doSort.emit(this.sortOption);
  }
}
