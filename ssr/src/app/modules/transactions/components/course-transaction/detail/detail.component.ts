import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ITransaction } from 'src/app/interface';
import { TransactionService, AuthService, StateService, STATE } from 'src/app/services';

@Component({
  templateUrl: './detail.html'
})
export class CourseTransactionDetailComponent implements OnInit {
  public transaction: ITransaction;
  public transactionId: string;
  public tutorId: string;
  public config: any;
  constructor(
    private route: ActivatedRoute,
    private transactionService: TransactionService,
    private authService: AuthService,
    public stateService: StateService
  ) {
    this.config = this.stateService.getState(STATE.CONFIG);
  }
  ngOnInit() {
    this.transactionId = this.route.snapshot.paramMap.get('id') as string;
    this.authService.getCurrentUser().then(resp => {
      this.tutorId = resp._id;
      this.transactionService.findOneTransactionCourse(this.tutorId, this.transactionId).then((res: any) => {
        this.transaction = res.data;
      });
    });
  }
}
