import { Component, Input, OnInit, inject } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { pick } from 'lodash-es';
import { UtilService } from 'src/services';
import {
  ButtonDirective,
  ButtonCloseDirective,
  ModalModule,
  FormLabelDirective,
  FormCheckComponent,
  FormCheckLabelDirective,
  FormCheckInputDirective,
} from '@coreui/angular';

@Component({
  selector: 'app-modal-create-category',
  templateUrl: './form.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    ButtonDirective,
    ButtonCloseDirective,
    FormLabelDirective,
    FormCheckComponent,
    FormCheckLabelDirective,
    FormCheckInputDirective,
    ModalModule,
  ],
})
export class MyCategoryFormComponent implements OnInit {
  @Input() categories: any[] = [];
  @Input() myCategory: any = {
    isActive: true,
  };
  @Input() visible = false;
  @Input() closeCallback: (result?: any) => void = () => {};

  public submitted = false;
  private utilService = inject(UtilService);

  ngOnInit() {
    if (!this.myCategory) {
      this.myCategory = { isActive: true };
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
    this.closeModal(pick(this.myCategory, ['originalCategoryId', 'isActive']));
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
  updateCategoryId(value: string) {
    if (!this.myCategory) {
      this.myCategory = { isActive: true };
    }
    this.myCategory.originalCategoryId = value;
  }

  updateIsActive(value: boolean) {
    if (!this.myCategory) {
      this.myCategory = {};
    }
    this.myCategory.isActive = value;
  }
}
