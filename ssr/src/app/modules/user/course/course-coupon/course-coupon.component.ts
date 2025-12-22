import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ICourse } from 'src/app/interface';
@Component({
  selector: 'app-course-coupon',
  templateUrl: './course-coupon.html'
})
export class CourseCouponComponent implements OnInit {
  @Input() course: ICourse;
  @Input() tutorId: string;
  @Output() doTabSelect = new EventEmitter();

  constructor() {}

  ngOnInit() {}

  onTab(tab: number) {
    this.doTabSelect.emit(tab);
  }
}
