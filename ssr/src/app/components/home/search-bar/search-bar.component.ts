import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { ICategory } from 'src/app/interface';
@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.html'
})
export class SearchBarComponent implements OnInit {
  @Input() config: any;
  public selectedCategory: ICategory;
  public categories: ICategory[];

  constructor(private router: Router, private route: ActivatedRoute) {
    const categories = this.route.snapshot.data['categories'];
    this.categories = categories;
  }

  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      map((term) =>
        term === ''
          ? []
          : this.categories
              .filter(
                (v: any) =>
                  v.name.toLowerCase().indexOf(term.toLowerCase()) > -1
              )
              .slice(0, 10)
      )
    );
  formatter = (x: any) => x.name;

  ngOnInit() {}

  submit() {
    if (!this.selectedCategory) {
      this.router.navigate(['/tutors']);
    } else
      this.router.navigate(['/tutors'], {
        queryParams: { category: this.selectedCategory.alias }
      });
  }

  keyPress(event: any) {
    if (event.charCode === 13) {
      this.submit();
    }
  }

  onSelect(event: any) {
    this.selectedCategory = event.item ?? '';
  }
}
