import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { pick } from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { IMyCategory, IMySubject, ISubject } from 'src/app/interface';
import { SubjectService } from 'src/app/services';
@Component({
  selector: 'app-my-subject-form',
  templateUrl: './my-subject.html'
})
export class MySubjectFormComponent implements OnInit {
  @Input() subjects: ISubject[];
  @Input() mySubject: IMySubject;
  @Input() selectedCategory: IMyCategory;
  public submitted = false;
  constructor(
    private toasty: ToastrService,
    public activeModal: NgbActiveModal,
    private subjectService: SubjectService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    if (this.selectedCategory) {
      this.querySubjects();
    }
  }

  submit(frm: any) {
    this.submitted = true;
    if (!frm.valid) {
      return this.toasty.error(this.translate.instant('Please complete the required fields!'));
    }
    return this.activeModal.close(pick(this.mySubject, ['isActive', 'originalSubjectId']));
  }

  querySubjects() {
    this.subjectService.search({ categoryIds: this.selectedCategory.originalCategoryId, take: 1000 }).then(resp => {
      if (resp.data && resp.data.items && resp.data.items.length > 0) {
        this.subjects = resp.data.items;
      } else {
        this.subjects = [];
      }
    });
  }
}
