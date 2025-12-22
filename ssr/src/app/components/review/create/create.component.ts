import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ICreateReview, IReview, IUser } from 'src/app/interface';
import { AppService, AuthService, ReviewService } from 'src/app/services';
import { NgbRatingModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared.module';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-review-create',
  templateUrl: './create.html',
  styleUrls: ['../../star-rating/star-rating.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgbRatingModule,
    SharedModule,
    TranslateModule,
    FormsModule,
    RouterModule
  ]
})
export class CreateReviewComponent implements OnInit {
  @Input() reviews: IReview[];
  @Input() options: any;
  @Output() createRating = new EventEmitter();
  public hovered: number;
  public review: ICreateReview = {
    comment: '',
    rating: 3,
    appointmentId: '',
    type: '',
    webinarId: '',
    courseId: ''
  };
  public params: any;
  public currentUser: IUser;
  public isLoggedin = false;
  public submitted = false;
  public checkReview = false;

  constructor(
    private appService: AppService,
    private reviewService: ReviewService,
    private auth: AuthService
  ) {
    if (auth.isLoggedin()) {
      this.isLoggedin = true;
    }
  }

  ngOnInit() {
    if (this.review && this.review.comment) {
      this.checkReview = true;
    } else if (
      (!this.review || !this.review.comment) &&
      this.auth.isLoggedin()
    ) {
      this.reviewService
        .current(this.options.appointmentId, { rateBy: this.options.rateBy })
        .then((resp: any) => {
          if (resp.data !== null) {
            this.checkReview = true;
          }
        });
    }
  }

  submit(frm: any) {
    this.submitted = true;
    this.review.appointmentId = this.options.appointmentId || null;
    this.review.webinarId = this.options.webinarId || null;
    this.review.courseId = this.options.courseId || null;
    this.review.type = this.options.type;
    this.reviewService
      .create(this.review)
      .then((resp: any) => {
        this.review = {
          comment: '',
          rating: 3,
          appointmentId: this.options.appointmentId,
          type: this.options.type,
          webinarId: this.options.webinarId,
          courseId: this.options.courseId
        };
        this.createRating.emit(resp.data);
        this.submitted = false;
        this.checkReview = true;
      })
      .catch(() => {
        this.appService.toastError();
      });
  }
}
