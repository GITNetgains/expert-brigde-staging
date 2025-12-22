import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { RequestRefundService, STATE, StateService } from 'src/app/services';
import { IRefund } from 'src/app/interface/refund';
@Component({
  selector: 'app-view-request-refund',
  templateUrl: './detail.html'
})
export class DetailRefundRequestComponent {
  public item: IRefund = {
    _id: '',
    amount: 10,
    reason: '',
    status: '',
    createdAt: ''
  };
  public config: any;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private refundService: RequestRefundService,
    private toasty: ToastrService,
    public stateService: StateService
  ) {
    const id = this.route.snapshot.params.id;
    this.config = this.stateService.getState(STATE.CONFIG);
    this.refundService.findOne(id).then((res: any) => {
      this.item = res.data;
    });
  }
}
