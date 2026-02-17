import {
  Component,
  OnInit,
  Input,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from 'src/services/review.service';
import { UtilService } from 'src/services';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReviewUpdateComponent } from '../update/update.component';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { AppPaginationComponent } from '@components/index';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardFooterComponent,
  ModalModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { cilTrash, cilPencil } from '@coreui/icons';

@Component({
  selector: 'app-review-tutor',
  templateUrl: './list.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    CardFooterComponent,
    StarRatingComponent,
    IconModule,
    ModalModule,
    AppPaginationComponent,
    ReviewUpdateComponent,
  ],
})
export class ReviewTutorComponent implements OnInit, OnChanges {
  @Input() tutorId: string = '';

  public page: number = 1;
  public pageSize: number = 5;
  public reviews: any[] = [];
  public total: number = 0;
  public updateReviewId: string = '';
  public showUpdateModal: boolean = false;
  public isLoading: boolean = false;
  public error: string = '';
  public togglingHiddenId: string | null = null;
  icons = { cilPencil, cilTrash };

  private reviewService = inject(ReviewService);
  private utilService = inject(UtilService);
  private route = inject(ActivatedRoute);

  constructor() {
    this.route.queryParams.subscribe((params) => {
      if (params['page']) {
        const page = parseInt(params['page']);
        this.page = !isNaN(page) ? page : 1;
        if (this.tutorId) {
          this.query();
        }
      }
    });
  }

  ngOnInit() {
    if (!this.tutorId) {
      this.error = 'No expert ID provided';
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tutorId'] && changes['tutorId'].currentValue) {
      this.query();
    }
  }

  query() {
    this.isLoading = true;
    this.error = '';

    if (!this.tutorId) {
      this.error = 'No expert ID provided';
      this.isLoading = false;
      return;
    }

    const params: any = {
      page: this.page,
      take: this.pageSize,
      rateTo: this.tutorId,
    };

    this.reviewService.list(params).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.reviews = res.data.items || [];
          this.total = res.data.count || 0;
        } else {
          this.reviews = [];
          this.total = 0;
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = `Failed to load reviews: ${err.status} ${err.statusText}`;
        this.reviews = [];
        this.total = 0;
        this.isLoading = false;
        this.utilService.toastError({
          title: 'Error',
          message: 'Failed to load reviews',
        });
      },
    });
  }

  update(item: any, i: number) {
    this.updateReviewId = item._id;
    this.showUpdateModal = true;
  }

  handleUpdateModalClose(result: any) {
    this.showUpdateModal = false;
    if (result && result._id) {
      const index = this.reviews.findIndex((r) => r._id === result._id);
      if (index !== -1) {
        this.reviews[index] = result;
      }
    }
  }

  onPageChange(event: any) {
    const page =
      typeof event === 'number'
        ? event
        : parseInt(event.target.value || event.target.innerText, 10);
    this.page = page;
    this.query();
  }

  remove(item: any, i: number) {
    if (confirm('Are you sure to delete this review?')) {
      this.reviewService.remove(item._id).subscribe({
        next: () => {
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'Review has been deleted!',
          });
          this.reviews.splice(i, 1);
          this.total--;
        },
        error: () => {
          this.utilService.toastError({
            title: 'Error',
            message: 'Something went wrong, please try again!',
          });
        },
      });
    }
  }

  toggleHidden(item: any, i: number) {
    this.togglingHiddenId = item._id;
    this.reviewService.toggleHidden(item._id).subscribe({
      next: (res: any) => {
        const updated = res?.data ?? res;
        if (updated && typeof updated.hidden === 'boolean') {
          this.reviews[i] = { ...this.reviews[i], hidden: updated.hidden };
        } else {
          this.reviews[i] = { ...this.reviews[i], hidden: !item.hidden };
        }
        this.utilService.toastSuccess({
          message: this.reviews[i].hidden ? 'Review is now hidden from users.' : 'Review is now visible to users.',
        });
        this.togglingHiddenId = null;
      },
      error: () => {
        this.utilService.toastError({
          title: 'Error',
          message: 'Failed to update visibility. Please try again.',
        });
        this.togglingHiddenId = null;
      },
    });
  }
}
