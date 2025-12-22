import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SubjectService, CategoryService } from '../../../../services';
import { pick } from 'lodash-es';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgSelectComponent } from '@ng-select/ng-select';
import { UtilService } from '../../../../services';
import { ListTopicComponent } from '@app/views/topic/list/list.component';
import {
  FormControlDirective,
  FormLabelDirective,
  ButtonDirective,
  CardBodyComponent,
  CardHeaderComponent,
  CardComponent,
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
export class UpdateSubjectComponent implements OnInit {
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
    private router: Router,
    private route: ActivatedRoute,
    private subjectService: SubjectService,
    private categoryService: CategoryService,
    private utilService: UtilService
  ) {}
  ngOnInit(): void {
    this.queryCategory();
    this.subjectId = this.route.snapshot.params['id'];

    this.route.params.subscribe((params) => {
      this.subjectService.findOne(params['id']).subscribe((response) => {
        this.subject = response.data;
      });
    });
    this.subjectService.findOne(this.subjectId).subscribe((resp) => {
      this.subject = pick(resp.data, [
        'name',
        'alias',
        'description',
        'price',
        'categoryIds',
        'isActive',
      ]);
    });
  }
  submit(frm: any) {
    this.customStylesValidated = true;
    if (!frm.valid) {
      this.utilService.toastError({
        title: 'errors',
        message: 'something wrong please try again',
      });
      return;
    }
    if (this.isSubmitted) {
      return this.utilService.toastError({
        title: 'error',
        message: 'Oops! You missed a required field',
      });
    }
    this.isSubmitted = true;
    this.subjectService
      .update(this.subjectId, this.subject)
      .subscribe((response) => {
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'Update subject success',
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
