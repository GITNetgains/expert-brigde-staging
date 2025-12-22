import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TopicService } from '@services/topic.service';
import { CategoryService } from '@services/category.service';
import { SubjectService } from '@services/subject.service';
import { UtilService } from '@services/util.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { pick } from 'lodash-es';
import { forkJoin } from 'rxjs';
import {
  FormControlDirective,
  FormLabelDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  FormDirective,
  RowComponent,
  ColComponent,
  FormFeedbackComponent,
  InputGroupComponent,
} from '@coreui/angular';

import { CategorySelectComponent } from '../../../../components/category/category-select/category-select.component';

@Component({
  selector: 'app-update-topic',
  standalone: true,
  templateUrl: '../form.html',
  imports: [
    CommonModule,
    FormDirective,
    FormControlDirective,
    FormLabelDirective,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    RowComponent,
    ColComponent,
    ReactiveFormsModule,
    FormsModule,
    NgSelectComponent,
    CategorySelectComponent,
    FormFeedbackComponent,
    InputGroupComponent,
  ],
})
export class UpdateTopicComponent implements OnInit {
  public topicId: string = '';
  public topic: any = {};
  public categories: any[] = [];
  public subjects: any = [];
  public isSubmitted: Boolean = false;
  public customStylesValidated = false;

  constructor(
    private topicService: TopicService,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private subjectService: SubjectService,
    private utilService: UtilService
  ) {}

  ngOnInit(): void {
    this.queryCategory();

    this.topicId = this.route.snapshot.params['id'];

    forkJoin({
      categories: this.categoryService.search({ take: 100 }),
      topic: this.topicService.findOne(this.topicId),
    }).subscribe(({ categories, topic }) => {
      this.categories = categories.data.items;
      // console.log(
      //   '🚀 ~ UpdateTopicComponent ~ ngOnInit ~ this.categories:',
      //   this.categories
      // );
      this.topic = pick(topic.data, [
        'name',
        'alias',
        'description',
        'ordering',
        'categoryIds',
        'subjectIds',
      ]);
      if (
        this.topic.subjectIds &&
        this.topic.categoryIds &&
        this.topic.categoryIds.length
      ) {
        this.querySubject(this.topic.categoryIds.join(','));
      }
    });
  }

  submit(frm: any): void {
    if (this.isSubmitted) {
      return this.utilService.toastError({
        title: 'Error',
        message: 'Oops! You missed a required field',
      });
    }
    this.customStylesValidated = true;

    if (!frm.valid) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Please check the form and try again',
      });
      return;
    }
    this.isSubmitted = true;

    this.topicService.update(this.topicId, this.topic).subscribe((resp) => {
      this.router.navigate(['/topic/list']);
      this.utilService.toastSuccess({
        title: 'Success',
        message: 'Topic updated successfully',
      });
    });
  }
  queryCategory() {
    this.categoryService.search({ take: 100 }).subscribe((resp) => {
      this.categories = resp.data.items;
    });
  }
  querySubject(categoryIds: string) {
    this.subjectService.search({ take: 100, categoryIds }).subscribe((resp) => {
      this.subjects = resp.data.items;
    });
  }

  selectCategory(event: any) {
    if (event && event.length > 0) {
      this.topic.categoryIds = event;
      this.topic.subjectIds = [];
      this.querySubject(this.topic.categoryIds.join(','));
    } else {
      this.subjects = [];
    }
  }
}
