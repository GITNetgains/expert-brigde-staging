import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import pick from 'lodash/pick';
import { TranslateService } from '@ngx-translate/core';
import { ICourse } from 'src/app/interface';
import { AppService, CourseService } from 'src/app/services';
@Component({
  selector: 'app-course-goal',
  templateUrl: './course-goal.html'
})
export class CourseGoalComponent implements OnInit {
  @Input() course: ICourse;
  @Output() doTabSelect = new EventEmitter();
  public courseId: string;
  public courseGoal: any = {
    goalCourse: '',
    whyJoinCourse: '',
    needToJoinCourse: ''
  };
  public isSubmitted = false;
  public index = 0;
  constructor(
    private translate: TranslateService,
    private appService: AppService,
    private courseService: CourseService
  ) {}

  ngOnInit() {
    this.courseId = this.course._id;
  }

  addItem(type: keyof ICourse) {
    this.course[type].push(this.courseGoal[type]);
    this.courseGoal[type] = '';
    this.submit();
  }

  submit() {
    this.isSubmitted = true;
    if (this.course._id) {
      this.courseService
        .update(
          this.courseId,
          pick(this.course, [
            'name',
            'price',
            'description',
            'alias',
            'categoryIds',
            'introductionVideoId',
            'mainImageId',
            'isFree',
            'goalCourse',
            'whyJoinCourse',
            'needToJoinCourse'
          ])
        )
        .then(() => {
          this.appService.toastSuccess('Updated successfuly!');
          //this.router.navigate(['/users/courses']);
        })
        .catch((err) => {
          this.appService.toastError(err);
        });
    }
  }

  removeItem(type: keyof ICourse, i: number) {
    if (
      window.confirm(this.translate.instant('Are you sure to delete this?'))
    ) {
      this.course[type].splice(i, 1);
      this.submit();
    }
  }

  onTab(tab: number) {
    this.doTabSelect.emit(tab);
  }
}
