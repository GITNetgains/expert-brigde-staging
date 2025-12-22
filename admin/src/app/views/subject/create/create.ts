import { Component, OnInit } from '@angular/core';
import {
  SubjectService,
  CategoryService,
  UtilService,
} from '../../../../services';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ListTopicComponent } from '@app/views/topic/list/list.component';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Router } from '@angular/router';

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
  Tabs2Module,
  TabsComponent,
} from '@coreui/angular';
@Component({
  selector: 'app-subject-update',
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
    FormFeedbackComponent,
    InputGroupComponent,
    Tabs2Module,
    TabsComponent,
    ListTopicComponent,
  ],
})
export class CreateSubjectComponent implements OnInit {
  public isSubmitted: Boolean = false;
  public customStylesValidated = false;
  public subject: any = {
    name: '',
    alias: '',
    description: '',
    categoryIds: [],
    isActive: true,
  };
  public subjectId: string = '';
  public categories: any[] = [];
  constructor(
    private subjectService: SubjectService,
    private categoryService: CategoryService,
    private utilService: UtilService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.queryCategory();
  }
  onFileSelected(event: any): void {}
  submit(frm: any): void {
    if (this.isSubmitted) {
      return this.utilService.toastError({
        title: 'error',
        message: 'Oops! You missed a required field',
      });
    }
    this.customStylesValidated = true;
    if (!frm.valid) {
      this.utilService.toastError({
        title: 'Errors',
        message: 'Please check the form and try again',
      });
      return;
    }
    this.isSubmitted = true;
    this.subjectService.create(this.subject).subscribe((resp) => {
      this.utilService.toastSuccess({
        title: 'Success',
        message: 'subject create successfully',
      });
      this.router.navigate(['/subject/list']);
    });
  }
  queryCategory() {
    this.categoryService.search({ take: 100 }).subscribe((resp) => {
      this.categories = resp.data.items;
    });
  }
}
