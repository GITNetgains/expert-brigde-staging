import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IconDirective } from '@coreui/icons-angular';
import { cilArrowTop, cilArrowBottom } from '@coreui/icons';

@Component({
  selector: 'app-sort',
  standalone: true,
  imports: [CommonModule, IconDirective],
  templateUrl: './sort.component.html',
  styleUrls: ['./sort.component.scss'],
})
export class SortComponent implements OnInit {
  icons = { cilArrowTop, cilArrowBottom };
  @Input({ required: true }) sortOption!: {
    sortBy: string;
    sortType: string;
  };

  @Input() sortBy: string = '';
  @Input() sortTitle: string = '';

  @Output() onSort = new EventEmitter<{ sortBy: string; sortType: string }>();

  ngOnInit(): void { }

  toggle(): void {
    if (this.sortOption.sortBy === this.sortBy) {
      const nextType = this.sortOption.sortType === 'asc' ? 'desc' : 'asc';
      this.sort(this.sortBy, nextType);
    } else {
      this.sort(this.sortBy, 'asc');
    }
  }

  sort(field: string, type: string): void {
    const sortOption = { sortBy: field, sortType: type };
    this.sortOption = sortOption;
    this.onSort.emit(this.sortOption);
  }
}
