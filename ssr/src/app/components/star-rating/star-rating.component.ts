import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  templateUrl: './star-rating.html',
  styleUrls: ['./star-rating.scss']
})
export class StarRatingComponent {

  @Input() rate: any;
  @Input() total: any;
}
