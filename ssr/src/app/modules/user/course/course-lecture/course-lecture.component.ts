import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { sortBy } from 'lodash';
import { ICourse, ILecture, ISection } from 'src/app/interface';
import { AppService, LectureService, SectionService } from 'src/app/services';
import { SectionFormComponent } from '../modal-section/section-form';
import { LectureFormComponent } from '../modal-lecture/lecture-form';
import * as jQuery from 'jquery';
@Component({
  selector: 'app-course-lecture',
  templateUrl: './course-lecture.html'
})
export class CourseLetureComponent implements OnInit {
  @Input() course: ICourse;
  @Output() doTabSelect = new EventEmitter();
  public courseId: string;
  public isSubmitted = false;
  public sections: ISection[] = [];
  public lectures: ILecture[] = [];
  public loading = false;
  constructor(
    private appService: AppService,
    private sectionService: SectionService,
    private modalService: NgbModal,
    private lectureService: LectureService
  ) {}

  ngOnInit() {
    this.courseId = this.course._id;
    if (this.courseId) {
      this.loading = true;
      this.sectionService
        .search({
          courseId: this.courseId,
          take: 100,
          sort: 'ordering',
          sortType: 'asc'
        })
        .then((resp) => {
          if (resp.data) {
            this.sections = resp.data.items;
            this.sections.map((section) => {
              section.lectures = sortBy(section.lectures, ['ordering']);
            });
            this.loading = false;
            (function ($) {
              $(document).ready(function () {
                $('#accordion').on(
                  'hide.bs.collapse show.bs.collapse',
                  (e: any) => {
                    $(e.target)
                      .prev()
                      .find('.btn-collapse i:last-child')
                      .toggleClass('fa-minus fa-plus');
                  }
                );
              });
            })(jQuery);
          }
        })
        .catch((err) => {
          this.appService.toastError(err);
          this.loading = false;
        });
    }
  }

  onTab(tab: number) {
    this.doTabSelect.emit(tab);
  }

  submitSection(section = {} as ISection) {
    const modalRef = this.modalService.open(SectionFormComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg'
    });
    modalRef.componentInstance.section = section;
    modalRef.result.then(
      (res) => {
        if (section._id) {
          this.sectionService
            .update(
              section._id,
              Object.assign(res, { courseId: this.courseId })
            )
            .then((resp) => {
              if (resp.data) {
                // section = resp.data;
                const index = this.sections.findIndex(
                  (item) => item._id === resp.data._id
                );
                this.sections[index] = resp.data;
                this.sections = sortBy(this.sections, ['ordering']);
                this.appService.toastSuccess('Updated successfully!');
              }
            })
            .catch((err) => {
              this.appService.toastError(err);
            });
        } else {
          this.sectionService
            .create(Object.assign(res, { courseId: this.courseId }))
            .then((resp) => {
              if (resp.data) {
                this.sections.push(Object.assign(resp.data, { lectures: [] }));
                this.sections = sortBy(this.sections, ['ordering']);
                this.appService.toastSuccess('Created successfully!');
              }
            })
            .catch((err) => {
              this.appService.toastError(err);
            });
        }
      },
      () => {
        return;
      }
    );
  }

  submitLecture(
    indexSection: number,
    sectionId: string,
    courseId: string,
    lecture = {} as ILecture
  ) {
    const modalRef = this.modalService.open(LectureFormComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg'
    });
    modalRef.componentInstance.lecture = lecture;
    modalRef.componentInstance.courseId = courseId;
    modalRef.result.then(
      (res) => {
        if (lecture._id) {
          this.lectureService
            .update(lecture._id, Object.assign(res, { sectionId }))
            .then((resp) => {
              if (resp.data) {
                lecture = resp.data;
                this.sections[indexSection].lectures = sortBy(
                  this.sections[indexSection].lectures,
                  ['ordering']
                );
                this.appService.toastSuccess('Updated successfully!');
              }
            })
            .catch((err) => {
              this.appService.toastError(err);
            });
        } else {
          this.lectureService
            .create(Object.assign(res, { sectionId }))
            .then((resp) => {
              if (resp.data) {
                this.sections[indexSection].lectures.push(resp.data);
                this.sections[indexSection].totalLecture += 1;
                this.sections[indexSection].lectures = sortBy(
                  this.sections[indexSection].lectures,
                  ['ordering']
                );
                this.appService.toastSuccess('Created successfully!');
              }
            })
            .catch((err) => {
              this.appService.toastError(err);
            });
        }
      },
      () => {
        return;
      }
    );
  }

  removeSection(item: any, index: number) {
    if (window.confirm('Are you sure to remove this section?')) {
      this.sectionService
        .delete(item._id)
        .then(() => {
          this.appService.toastSuccess('Item has been deleted!');
          this.sections.splice(index, 1);
        })
        .catch((e) => this.appService.toastError(e));
    }
  }
  removeLecture(indexSection: number, item: any, index: number) {
    if (window.confirm('Are you sure to remove this lecture?')) {
      this.lectureService
        .delete(item._id)
        .then(() => {
          this.appService.toastSuccess('Item has been deleted!');
          this.sections[indexSection].totalLecture -= 1;
          this.sections[indexSection].lectures.splice(index, 1);
        })
        .catch((e) => this.appService.toastError(e));
    }
  }
}
