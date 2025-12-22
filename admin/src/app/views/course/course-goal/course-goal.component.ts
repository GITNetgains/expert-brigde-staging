import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { pick } from 'lodash-es';
import { UtilService, CourseService } from 'src/services';
import {
  ButtonDirective,
  CardComponent,
  CardBodyComponent,
  FormModule,
  GridModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { cilTrash } from '@coreui/icons';

@Component({
  selector: 'course-goal',
  templateUrl: './course-goal.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    CardBodyComponent,
    ButtonDirective,
    FormModule,
    GridModule,
    IconModule,
  ],
})
export class CourseGoalComponent implements OnInit {
  @Input() course: any;
  @Output() onTabSelect = new EventEmitter<number>();

  private utilService = inject(UtilService);
  private courseService = inject(CourseService);

  public courseId: string = '';
  public courseGoal: any = {
    goalCourse: '',
    whyJoinCourse: '',
    needToJoinCourse: '',
  };
  public isSubmitted: boolean = false;
  public index: number = 0;
  icons = { cilTrash };

  ngOnInit() {
    this.courseId = this.course._id;
  }

  addItem(type: string) {
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
            'tutorId',
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
            'needToJoinCourse',
          ])
        )
        .subscribe({
          next: (resp: any) => {
            this.utilService.toastSuccess({
              title: 'Success',
              message: 'Updated successfully!',
            });
          },
          error: (err: any) => {
            this.utilService.toastError({
              title: 'Error',
              message:
                err.data?.data?.message ||
                err.data?.message ||
                'Something went wrong!',
            });
          },
        });
    }
  }

  removeItem(type: string, i: number) {
    if (window.confirm('Are you sure to delete this?')) {
      this.course[type].splice(i, 1);
      this.submit();
    }
  }

  onTab(tab: number) {
    this.onTabSelect.emit(tab);
  }
}
