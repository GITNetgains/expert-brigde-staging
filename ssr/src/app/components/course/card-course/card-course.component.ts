import { CommonModule } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ICategory, ICourse } from 'src/app/interface';
import { STATE, StateService, SystemService } from 'src/app/services';
import { SharedModule } from 'src/app/shared.module';

@Component({
  standalone: true,
  selector: 'app-card-course',
  templateUrl: './card-course.html',
  imports: [RouterModule, SharedModule, CommonModule, TranslateModule]
})
export class CardCourseComponent implements OnInit {
  @Input() course: ICourse;
  public category: ICategory;
  public categories = '';
  public searchFields: any = {
    categoryIds: ''
  };
  public config: any;
  public url = '';
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public stateService: StateService,
    public systemService: SystemService
  ) {
    this.config = this.stateService.getState(STATE.CONFIG);
    this.url = this.router.url;
  }

  ngOnInit() {
    if (this.course && this.course?.categories && this.course?.categories.length > 0) {
      this.category = this.course?.categories[0];
      this.course.categories.forEach(cat => {
        this.categories = this.categories + cat.name + ', ';
      });
      this.categories = this.categories.slice(0, -2);
    }
  }

  clickCategory(catId: any) {
    const categoryIds = [];
    categoryIds.push(catId);
    this.searchFields.categoryIds = categoryIds.join(',');
    this.router.navigate(['/categories'], {
      queryParams: { categoryIds: this.searchFields.categoryIds }
    });
  }
}
