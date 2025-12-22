import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { pick } from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { ICategory } from 'src/app/interface';
@Component({
  selector: 'app-modal-create-category',
  templateUrl: './form.html'
})
export class MyCategoryFormComponent {
  @Input() categories: ICategory[];
  @Input() myCategory = {
    isActive: true
  } as any;

  public submitted = false;
  constructor(private toasty: ToastrService, public activeModal: NgbActiveModal, private translate: TranslateService) { }

  submit(frm: any) {
    this.submitted = true;
    if (!frm.valid) {
      return this.toasty.error(this.translate.instant('Please complete the required fields!'));
    }
    return this.activeModal.close(pick(this.myCategory, ['originalCategoryId', 'isActive']));
  }
}
