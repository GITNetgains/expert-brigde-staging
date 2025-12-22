import { Component, OnInit, Input } from '@angular/core';
import { pick } from 'lodash';
import { TranslateModule } from '@ngx-translate/core';
import { NgbActiveModal, NgbRatingModule } from '@ng-bootstrap/ng-bootstrap';
import { AppService, ReviewService } from 'src/app/services';
import { SharedModule } from 'src/app/shared.module';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-review-edit',
  templateUrl: './update.html',
  styleUrls: ['../../star-rating/star-rating.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgbRatingModule,
    SharedModule,
    TranslateModule,
    FormsModule
  ]
})
export class ReviewUpdateComponent implements OnInit {
  @Input() reviewId: any;
  public review: any = {};
  public submitted = false;
  public hovered: number;

  constructor(
    private appService: AppService,
    private reviewService: ReviewService,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit() {
    // check review allowable or not
    this.reviewService
      .findOne(this.reviewId)
      .then((resp) => {
        this.review = resp.data;
      })
      .catch(() => this.appService.toastError());
  }

  submit() {
    this.submitted = true;

    if (!this.review.comment) {
      return this.appService.toastError('Invalid form, please recheck again.');
    }

    const data = pick(this.review, ['comment', 'rating']);
    return this.reviewService
      .update(this.review._id, data)
      .then((resp) => {
        this.appService.toastSuccess('Updated successfully!');
        this.activeModal.close(resp.data);
      })
      .catch(() => this.appService.toastError());
  }
}
