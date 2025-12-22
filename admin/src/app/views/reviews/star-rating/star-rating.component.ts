import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconModule } from '@coreui/icons-angular';
import { cilStar } from '@coreui/icons';

@Component({
  selector: 'star-rating',
  templateUrl: './star-rating.html',
  styleUrls: ['./star-rating.scss'],
  standalone: true,
  imports: [CommonModule, IconModule],
})
export class StarRatingComponent implements OnInit {
  @Input() rate: number = 0;
  @Input() total: number = 0;
  icons = { cilStar };

  ngOnInit() {}
}
