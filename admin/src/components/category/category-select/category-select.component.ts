import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  input,
} from '@angular/core';
import { CategoryService } from '@services/category.service';
import { NgSelectComponent } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-category-select',
  templateUrl: './category-select.component.html',
  standalone: true,
  imports: [CommonModule, NgSelectComponent, FormsModule],
})
export class CategorySelectComponent implements OnChanges {
  @Input() categories: any[] = [];
  @Input() selectedCategoryIds: string[] = [];
  @Output() selectedCategoryIdsChange = new EventEmitter<string[]>();
  @Input() selectedCategory: string | null = null;
  // @Output() categoryChange = new EventEmitter<string>();
  @Input() query: Record<string, any> = {};
  @Input() showLabel: boolean = true;

  constructor(private categoryService: CategoryService) {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['query']) {
      this.queryChange();
    }
  }
  queryChange() {
    this.categoryService.search(this.query).subscribe((response) => {
      this.categories = response.data.items;
    });
  }

  onCategorySelect(): void {
    this.selectedCategoryIdsChange.emit(this.selectedCategoryIds);
  }
}
