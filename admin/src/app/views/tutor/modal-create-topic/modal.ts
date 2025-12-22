import { Component, Input, OnInit, inject } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { pick } from 'lodash-es';
import { UtilService, TopicService } from 'src/services';
import {
  ButtonDirective,
  ModalModule,
  FormLabelDirective,
  FormControlDirective,
  FormCheckComponent,
  FormCheckLabelDirective,
  FormCheckInputDirective,
  ButtonCloseDirective,
} from '@coreui/angular';

@Component({
  selector: 'app-modal-create-topic',
  templateUrl: './form.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    ButtonDirective,
    FormLabelDirective,
    FormControlDirective,
    FormCheckComponent,
    FormCheckLabelDirective,
    FormCheckInputDirective,
    ButtonCloseDirective,
    ModalModule,
  ],
})
export class MyTopicFormComponent implements OnInit {
  @Input() topics: any[] = [];
  @Input() myTopic: any = {
    isActive: true,
    price: 0,
  };
  @Input() selectedSubject: any;
  @Input() visible = false;
  @Input() closeCallback: (result?: any) => void = () => {};

  public submitted = false;

  private utilService = inject(UtilService);
  private topicService = inject(TopicService);

  ngOnInit() {
    if (!this.myTopic) {
      this.myTopic = { isActive: true, price: 0, originalTopicId: null };
    }

    if (this.selectedSubject) {
      this.queryTopics();
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

    if (this.myTopic?.price < 0) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Price must be equal or greater than 0',
      });
      return;
    }

    this.closeModal(
      pick(this.myTopic, ['originalTopicId', 'isActive', 'price'])
    );
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

  queryTopics() {
    if (!this.selectedSubject?.originalSubjectId) {
      return;
    }

    this.topicService
      .search({
        subjectIds: this.selectedSubject.originalSubjectId,
        take: 1000,
      })
      .subscribe({
        next: (resp: any) => {
          if (resp.data?.items?.length > 0) {
            this.topics = resp.data.items;
          } else {
            this.topics = [];
          }
        },
      });
  }

  updateTopicId(value: string) {
    if (!this.myTopic) {
      this.myTopic = { isActive: true, price: 0 };
    }
    this.myTopic.originalTopicId = value;
  }

  updatePrice(value: number) {
    if (!this.myTopic) {
      this.myTopic = { isActive: true };
    }
    this.myTopic.price = value;
  }

  updateIsActive(value: boolean) {
    if (!this.myTopic) {
      this.myTopic = { price: 0 };
    }
    this.myTopic.isActive = value;
  }
}
