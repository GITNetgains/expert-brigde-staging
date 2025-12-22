import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { pick } from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { IMySubject, ITopic } from 'src/app/interface';
import { TopicService } from 'src/app/services';
@Component({
  selector: 'app-modal-create-category',
  templateUrl: './form.html'
})
export class MyTopicFormComponent implements OnInit {
  @Input() topics: ITopic[];
  @Input() myTopic = {
    isActive: true
  } as any;
  @Input() selectedSubject: IMySubject;

  public submitted = false;
  constructor(
    private toasty: ToastrService,
    private translate: TranslateService,
    public activeModal: NgbActiveModal,
    private topicService: TopicService
  ) { }

  ngOnInit() {
    if (this.selectedSubject) {
      this.queryTopic();
    }
  }

  submit(frm: any) {
    this.submitted = true;
    if (this.myTopic.price && this.myTopic.price <= 0) {
      return this.toasty.error(this.translate.instant('Price must be equal or greater than 0!'));
    }
    if (!frm.valid) {
      return this.toasty.error(this.translate.instant('Please complete the required fields!'));
    }
    return this.activeModal.close(pick(this.myTopic, ['originalTopicId', 'isActive', 'price']));
  }

  queryTopic() {
    this.topicService.search({ subjectIds: this.selectedSubject.originalSubjectId, take: 1000 }).then(resp => {
      if (resp.data && resp.data.items && resp.data.items.length > 0) {
        this.topics = resp.data.items;
      } else {
        this.topics = [];
      }
    });
  }
}
