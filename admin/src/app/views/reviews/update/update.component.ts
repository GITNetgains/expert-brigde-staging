import {
  Component,
  OnInit,
  Input,
  inject,
  Output,
  EventEmitter,
} from '@angular/core';
import { pick } from 'lodash-es';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReviewService } from 'src/services/review.service';
import { UtilService } from 'src/services';
import {
  ButtonDirective,
  FormControlDirective,
  ModalModule,
  ButtonCloseDirective,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { cilStar } from '@coreui/icons';

@Component({
  selector: 'app-review-edit',
  templateUrl: './update.html',
  styleUrls: ['./star-rating.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonDirective,
    FormControlDirective,
    ModalModule,
    ButtonCloseDirective,
    IconModule,
  ],
})
export class ReviewUpdateComponent implements OnInit {
  @Input() reviewId: string = '';
  @Output() closeModal = new EventEmitter<any>();

  public review: any = {};
  public submitted: boolean = false;
  public hovered: number = 0;
  public visible: boolean = true;
  icons = { cilStar };

  private reviewService = inject(ReviewService);
  private utilService = inject(UtilService);

  ngOnInit() {
    this.loadReview();
  }

  loadReview() {
    this.reviewService.findOne(this.reviewId).subscribe({
      next: (resp: any) => {
        this.review = resp.data;
        this.review.rating = resp.data.rating;
        this.review.comment = resp.data.comment;
      },
      error: () => {
        this.utilService.toastError({
          title: 'Error',
          message: 'Something went wrong, please try again.',
        });
      },
    });
  }

  submit() {
    this.submitted = true;

    if (!this.review.comment) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Invalid form, please recheck again.',
      });
      return;
    }

    const data = pick(this.review, ['comment', 'rating']);
    this.reviewService.update(this.review._id, data).subscribe({
      next: (resp: any) => {
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'Updated successfully!',
        });
        this.handleModalChange(false, resp.data);
      },
      error: () => {
        this.utilService.toastError({
          title: 'Error',
          message: 'Something went wrong, please try again.',
        });
      },
    });
  }

  handleModalChange(event: boolean, result?: any) {
    this.visible = event;
    if (!event) {
      this.closeModal.emit(result);
    }
  }
}
