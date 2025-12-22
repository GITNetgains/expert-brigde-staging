import { Component, Input, OnInit, inject } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { pick } from 'lodash-es';
import { UtilService } from 'src/services';
import { SubjectService } from 'src/services/subject.service';
import {
  ButtonDirective,
  ModalModule,
  FormLabelDirective,
  FormCheckComponent,
  FormCheckLabelDirective,
  FormCheckInputDirective,
  ButtonCloseDirective,
} from '@coreui/angular';

@Component({
  selector: 'app-my-subject-form',
  templateUrl: './my-subject.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    ButtonDirective,
    FormLabelDirective,
    FormCheckComponent,
    FormCheckLabelDirective,
    FormCheckInputDirective,
    ButtonCloseDirective,
    ModalModule,
  ],
})
export class MySubjectFormComponent implements OnInit {
  @Input() subjects: any[] = [];
  @Input() mySubject: any = {
    isActive: true,
  };
  @Input() selectedCategory: any;
  @Input() visible = false;
  @Input() closeCallback: (result?: any) => void = () => {};

  public submitted = false;

  private utilService = inject(UtilService);
  private subjectService = inject(SubjectService);

  ngOnInit() {
    if (!this.mySubject) {
      this.mySubject = { isActive: true, originalSubjectId: null };
    }

    if (this.selectedCategory) {
      this.querySubjects();
    }
  }

  submit(frm: NgForm) {
    this.submitted = true;
    if (!frm.valid) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Please complete the required fields!',
      });
      return;
    }
    this.closeModal(pick(this.mySubject, ['isActive', 'originalSubjectId']));
  }

  closeModal(result?: any) {
    this.visible = false;
    if (result) {
      this.closeCallback(result);
    }
  }

  handleModalChange(event: boolean) {
    this.visible = event;
    if (!event) {
      this.closeCallback();
    }
  }

  querySubjects() {
    if (!this.selectedCategory || !this.selectedCategory.originalCategoryId) {
      return;
    }

    this.subjectService
      .search({
        categoryIds: this.selectedCategory.originalCategoryId,
        take: 1000,
        isActive: true,
      })
      .subscribe({
        next: (resp: any) => {
          if (resp.data?.items) {
            this.subjects = resp.data.items;
          }
        },
      });
  }

  updateSubjectId(value: string) {
    if (!this.mySubject) {
      this.mySubject = { isActive: true };
    }
    this.mySubject.originalSubjectId = value;
  }

  updateIsActive(value: boolean) {
    if (!this.mySubject) {
      this.mySubject = {};
    }
    this.mySubject.isActive = value;
  }
}
