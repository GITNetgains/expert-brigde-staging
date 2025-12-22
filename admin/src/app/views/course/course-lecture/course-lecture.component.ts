import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { sortBy } from 'lodash-es';
import { UtilService, SectionService, LectureService } from 'src/services';
import { SectionFormComponent } from '../model-section/section-form';
import { LectureFormComponent } from '../modal-lecture/lecture-form';

import {
  ButtonDirective,
  CardComponent,
  CardBodyComponent,
  FormModule,
  GridModule,
  ModalService,
  AccordionModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { cilTrash, cilPencil } from '@coreui/icons';

interface Section {
  _id: string;
  title: string;
  description?: string;
  ordering: number;
  totalLecture: number;
  lectures: Lecture[];
  courseId: string;
}

interface Lecture {
  _id: string;
  title: string;
  description?: string;
  ordering: number;
  sectionId: string;
  courseId: string;
  mediaIds?: string[];
}

@Component({
  selector: 'course-lecture',
  templateUrl: './course-lecture.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    FormModule,
    GridModule,
    AccordionModule,
    SectionFormComponent,
    LectureFormComponent,
    IconModule,
  ],
})
export class CourseLectureComponent implements OnInit {
  @Input() course: any = {};
  @Output() onTabSelect = new EventEmitter<number>();

  @ViewChild('sectionModal') sectionModalRef!: ElementRef;
  @ViewChild('lectureModal') lectureModalRef!: ElementRef;

  private utilService = inject(UtilService);
  private modalService = inject(ModalService);
  private sectionService = inject(SectionService);
  private lectureService = inject(LectureService);

  public courseId: string = '';
  public isSubmitted: boolean = false;
  public sections: Section[] = [];
  public lectures: Lecture[] = [];
  public loading: boolean = false;
  public activeAccordion: string | null = null;

  public currentSection: Partial<Section> = {};
  public currentLecture: Partial<Lecture> = {};
  public currentSectionIndex: number = -1;
  public showSectionModal: boolean = false;
  public showLectureModal: boolean = false;
  icons = { cilTrash, cilPencil };

  ngOnInit() {
    this.courseId = this.course._id;
    if (this.courseId) {
      this.loading = true;
      this.fetchSections();
    }
  }

  fetchSections() {
    this.sectionService
      .search({
        courseId: this.courseId,
        sort: 'ordering',
        sortType: 'asc',
        take: 100,
      })
      .subscribe({
        next: (resp: any) => {
          if (resp.data && resp.data.items) {
            this.sections = resp.data.items;
            this.sections.forEach((section, index) => {
              this.fetchLectures(section, index);
            });

            if (this.sections.length > 0) {
              this.activeAccordion = this.sections[0]._id;
            }
          }
          this.loading = false;
        },
        error: (err: any) => {
          this.loading = false;
          this.utilService.toastError({
            title: 'Error',
            message: err.data?.message || 'Failed to load sections',
          });
        },
      });
  }

  fetchLectures(section: Section, sectionIndex: number) {
    this.lectureService
      .search({
        sectionId: section._id,
        courseId: this.courseId,
        sort: 'ordering',
        sortType: 'asc',
        take: 100,
      })
      .subscribe({
        next: (resp: any) => {
          if (resp.data && resp.data.items) {
            this.sections[sectionIndex].lectures = resp.data.items;
            this.sections[sectionIndex].totalLecture = resp.data.items.length;
          } else {
            this.sections[sectionIndex].lectures = [];
            this.sections[sectionIndex].totalLecture = 0;
          }
        },
        error: (err: any) => {
          this.utilService.toastError({
            title: 'Error',
            message: err.data?.message || 'Failed to load lectures',
          });
          this.sections[sectionIndex].lectures = [];
          this.sections[sectionIndex].totalLecture = 0;
        },
      });
  }

  onTab(tab: number) {
    this.onTabSelect.emit(tab);
  }

  toggleAccordion(sectionId: string) {
    this.activeAccordion =
      this.activeAccordion === sectionId ? null : sectionId;
  }

  submitSection(section: Partial<Section> = {}) {
    this.currentSection = section;
    this.showSectionModal = true;
  }

  submitLecture(
    indexSection: number,
    sectionId: string,
    courseId: string,
    lecture: Partial<Lecture> = {}
  ) {
    this.currentSectionIndex = indexSection;

    this.currentLecture = { ...lecture };

    this.currentLecture.sectionId = sectionId;
    this.currentLecture.courseId = courseId;

    this.showLectureModal = true;
  }

  updateSection(sectionId: string, formData: any) {
    this.sectionService
      .update(sectionId, {
        ...formData,
        courseId: this.courseId,
      })
      .subscribe({
        next: (resp: any) => {
          if (resp.data) {
            const index = this.sections.findIndex(
              (item) => item._id === sectionId
            );
            if (index !== -1) {
              const lectures = this.sections[index].lectures;
              this.sections[index] = {
                ...resp.data,
                lectures: lectures || [],
              };
              this.sections = sortBy(this.sections, ['ordering']);
            }
            this.utilService.toastSuccess({
              title: 'Success',
              message: 'Updated successfully!',
            });
          }
        },
        error: (err: any) => {
          this.utilService.toastError({
            title: 'Error',
            message: err.data?.message || 'Failed to update section',
          });
        },
      });
  }

  createSection(formData: any) {
    this.sectionService
      .create({
        ...formData,
        courseId: this.courseId,
      })
      .subscribe({
        next: (resp: any) => {
          if (resp.data) {
            const newSection: Section = {
              ...resp.data,
              lectures: [],
              totalLecture: 0,
            };
            this.sections.push(newSection);
            this.sections = sortBy(this.sections, ['ordering']);

            this.activeAccordion = newSection._id;

            this.utilService.toastSuccess({
              title: 'Success',
              message: 'Created successfully!',
            });
          }
        },
        error: (err: any) => {
          this.utilService.toastError({
            title: 'Error',
            message: err.data?.message || 'Failed to create section',
          });
        },
      });
  }

  updateLecture(indexSection: number, lectureId: string, formData: any) {
    this.lectureService
      .update(lectureId, {
        ...formData,
        sectionId: this.sections[indexSection]._id,
        courseId: this.courseId,
      })
      .subscribe({
        next: (resp: any) => {
          if (resp.data) {
            const lectureIndex = this.sections[indexSection].lectures.findIndex(
              (item) => item._id === lectureId
            );

            if (lectureIndex !== -1) {
              this.sections[indexSection].lectures[lectureIndex] = resp.data;
              this.sections[indexSection].lectures = sortBy(
                this.sections[indexSection].lectures,
                ['ordering']
              );
            }

            this.utilService.toastSuccess({
              title: 'Success',
              message: 'Updated successfully!',
            });
          }
        },
        error: (err: any) => {
          this.utilService.toastError({
            title: 'Error',
            message: err.data?.message || 'Failed to update lecture',
          });
        },
      });
  }

  createLecture(indexSection: number, sectionId: string, formData: any) {
    this.lectureService
      .create({
        ...formData,
        sectionId: sectionId,
        courseId: this.courseId,
      })
      .subscribe({
        next: (resp: any) => {
          if (resp.data) {
            if (!this.sections[indexSection].lectures) {
              this.sections[indexSection].lectures = [];
            }

            this.sections[indexSection].lectures.push(resp.data);
            this.sections[indexSection].totalLecture += 1;
            this.sections[indexSection].lectures = sortBy(
              this.sections[indexSection].lectures,
              ['ordering']
            );

            this.utilService.toastSuccess({
              title: 'Success',
              message: 'Created successfully!',
            });
          }
        },
        error: (err: any) => {
          this.utilService.toastError({
            title: 'Error',
            message: err.data?.message || 'Failed to create lecture',
          });
        },
      });
  }

  removeSection(item: Section, index: number) {
    if (
      window.confirm(
        'Are you sure to remove this section? This will also delete all lectures in this section.'
      )
    ) {
      this.sectionService.delete(item._id).subscribe({
        next: () => {
          this.sections.splice(index, 1);
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'Section and its lectures have been deleted!',
          });
        },
        error: (err: any) => {
          this.utilService.toastError({
            title: 'Error',
            message: err.data?.message || 'Failed to delete section',
          });
        },
      });
    }
  }

  removeLecture(indexSection: number, item: Lecture, index: number) {
    if (window.confirm('Are you sure to remove this lecture?')) {
      this.lectureService.delete(item._id).subscribe({
        next: () => {
          this.sections[indexSection].totalLecture -= 1;
          this.sections[indexSection].lectures.splice(index, 1);
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'Lecture has been deleted!',
          });
        },
        error: (err: any) => {
          this.utilService.toastError({
            title: 'Error',
            message: err.data?.message || 'Failed to delete lecture',
          });
        },
      });
    }
  }

  onSectionFormSubmit(data: any) {
    this.showSectionModal = false;
    if (this.currentSection._id) {
      this.updateSection(this.currentSection._id, data);
    } else {
      this.createSection(data);
    }
  }

  onLectureFormSubmit(data: any) {
    this.showLectureModal = false;
    if (this.currentLecture._id) {
      this.updateLecture(
        this.currentSectionIndex,
        this.currentLecture._id,
        data
      );
    } else {
      this.createLecture(
        this.currentSectionIndex,
        this.currentLecture.sectionId as string,
        data
      );
    }
  }

  onModalClose() {
    this.showSectionModal = false;
    this.showLectureModal = false;
  }
}
