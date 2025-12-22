import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { TopicService } from '@services/topic.service';
import { CategoryService } from '@services/category.service';
import { SubjectService } from '@services/subject.service';
import { UtilService } from '@services/util.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { CategorySelectComponent } from '../../../../components/category/category-select/category-select.component';

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
@Component({
  selector: 'app-create-topic',
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
export class CreateTopicComponent implements OnInit {
  public topic: any = {
    name: '',
    alias: '',
    description: '',
    ordering: 0,
    categoryIds: [],
    subjectIds: [],
  };

  public topicId: string = '';
  public isSubmitted: Boolean = false;
  public categories: any = [];
  public subjects: any = [];
  public customStylesValidated = false;

  constructor(
    private fb: FormBuilder,
    private topicService: TopicService,
    private subjectService: SubjectService,
    private categoryService: CategoryService,
    private router: Router,
    private utilService: UtilService
  ) {}

  ngOnInit(): void {
    this.queryCategory();
  }

  submit(frm: any): void {
    if (this.isSubmitted) {
      return this.utilService.toastError({
        title: 'error',
        message: 'Oops! You missed a required field',
      });
    }
    this.customStylesValidated = true;
    if (frm.invalid) {
      this.utilService.toastError({
        title: 'Invalid form',
        message: 'Please complete the required fields.',
      });
      return;
    }
    this.isSubmitted = true;

    this.topicService.create(this.topic).subscribe((resp) => {
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
    this.topic.categoryIds = event;
    this.topic.subjectIds = [];
    this.querySubject(this.topic.categoryIds.join(','));
  }
}
