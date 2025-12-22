import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';
import { IMylesson, ISubject, IUser } from 'src/app/interface';
@Component({
  selector: 'app-stripe',
  templateUrl: './confirm.html'
})
export class ConfirmModalComponent {
  @Input() subject: ISubject;
  @Input() tutor: IUser;
  @Input() slot: IMylesson;
  @Input() price = 0;
  @Input() config: any;
  @Input() appliedCoupon = false;
  constructor(public activeModal: NgbActiveModal, private toasty: ToastrService, private route: ActivatedRoute) { }
  confirm() {
    this.activeModal.close({ confirmed: true });
  }
}
