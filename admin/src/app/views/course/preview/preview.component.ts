import { CourseService, SectionService, AuthService } from 'src/services';
import { Component, Input, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UtilService } from 'src/services';
import { environment } from '../../../../environments/environment';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  CardTitleDirective,
  ModalModule,
  ButtonCloseDirective,
  FormControlDirective,
  ModalBodyComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';
import { cilFile, cilChevronBottom, cilMediaPlay } from '@coreui/icons';
import { catchError, of } from 'rxjs';
import {
  PdfViewerComponent,
  PdfViewerConfig,
} from '../../../../components/common/pdf-viewer/pdf-viewer.component';

interface CourseData {
  _id: string;
  name: string;
  isDraff: boolean;
  approved: boolean;
  totalLecture: number;
  totalLength: number;
  totalSection: number;
  totalMedia: number;
  videoIntroduction?: {
    fileUrl: string;
  };
  createBy: string;
}

interface Media {
  _id: string;
  name: string;
  mediaType: 'video' | 'audio' | 'pdf';
  media: {
    name: string;
    fileUrl: string;
    duration: number;
  };
  totalLength?: number;
}

interface Lecture {
  _id: string;
  title: string;
  duration: number;
  medias: Media[];
}

interface Section {
  _id: string;
  title: string;
  duration: number;
  totalLecture: number;
  lectures: Lecture[];
  lectureIds: string[];
}

interface UserResponse {
  id: string;
  [key: string]: any;
}

@Component({
  selector: 'app-course-preview',
  templateUrl: './preview.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleDirective,
    ModalModule,
    ButtonCloseDirective,
    FormControlDirective,
    ModalBodyComponent,
    ModalFooterComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    IconModule,
    PdfViewerComponent,
  ],
})
export class CoursePreviewComponent implements OnInit {
  public course: CourseData | null = null;
  public courseId: string = '';
  public sections: Section[] = [];
  public createdBy: string = '';
  public adminId: string = '';

  public indexSection: number = -1;
  public indexLecture: number = -1;
  public indexMedia: number = -1;

  public shownItem: {
    title: string;
    type: string;
    url: string | null;
  } = {
    title: 'Introduction Video',
    type: 'video',
    url: null,
  };
  public openLectureId: string = '';
  public openFileId: string = '';
  icons = { cilFile, cilChevronBottom, cilMediaPlay };

  public pdfConfig: PdfViewerConfig = {
    height: '100%',
    showToolbar: true,
    showSidebarButton: true,
    showDownloadButton: true,
    showPrintButton: true,
    showRotateButton: true,
    showSecondaryToolbarButton: true,
    showHandToolButton: true,
    useBrowserLocale: true,
    listenToURL: false,
    zoom: 'auto',
  };

  private auth = inject(AuthService);
  private courseService = inject(CourseService);
  private route = inject(ActivatedRoute);
  private sectionService = inject(SectionService);
  private utilService = inject(UtilService);

  public rejectModalVisible = false;
  public rejectReason = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.courseId = id;
    }

    this.auth.getCurrentUser().subscribe((resp: UserResponse) => {
      this.adminId = resp.id;
    });

    this.courseService
      .findOne(this.courseId)
      .pipe(
        catchError((e: any) => {
          this.utilService.toastError({
            title: 'Error',
            message:
              e.data && e.data.data && e.data.data.message
                ? e.data.data.message
                : 'Something went wrong, please try again!',
          });
          return of(null);
        })
      )
      .subscribe((resp: any) => {
        if (!resp) return;

        this.course = resp.data;
        if (this.course && !this.course.isDraff) {
          this.course.totalLecture = 0;
          this.course.totalLength = 0;

          if (
            this.course.videoIntroduction &&
            this.course.videoIntroduction.fileUrl
          ) {
            this.shownItem = {
              title: 'Introduction Video',
              type: 'video',
              url: this.course.videoIntroduction.fileUrl,
            };
          }

          this.createdBy = resp.data.createBy;
          this.sectionService
            .search({
              courseId: this.courseId,
              take: 100,
              sort: 'ordering',
              sortType: 'asc',
            })
            .pipe(
              catchError((err: any) => {
                this.utilService.toastError({
                  title: 'Error',
                  message:
                    err.data && err.data.data && err.data.data.message
                      ? err.data.data.message
                      : 'Something went wrong, please try again!',
                });
                return of(null);
              })
            )
            .subscribe((res: any) => {
              if (res && res.data) {
                this.sections = res.data.items;
                this.sections.forEach((item: Section) => {
                  this.calDuration(item);
                  if (this.course) {
                    this.course.totalLength += item.duration;
                    this.course.totalLecture += item.totalLecture;
                  }
                });
              }
            });
        }
      });
  }

  returnDuration(seconds: number): string {
    if (seconds == 0) return '00:00';
    else if (seconds < 10) return '00:0' + seconds;
    var duration: string = '';
    if (seconds < 60) return '00:' + seconds;
    else {
      var hour: string | number = 0;
      var minute: string | number = 0;
      var second: string | number = 0;

      hour = seconds < 3600 ? 0 : Math.floor(seconds / 3600);
      if (hour > 0) {
        if (hour < 10) hour = '0' + hour;
        duration = hour + ':';
      }
      var remainSecond = seconds - Number(hour) * 3600;
      minute =
        Math.floor(remainSecond / 60) < 10
          ? '0' + Math.floor(remainSecond / 60)
          : Math.floor(remainSecond / 60);
      second = seconds - Number(hour) * 3600 - Number(minute) * 60;
      if (second < 10) second = '0' + second;
      return duration + minute + ':' + second;
    }
  }

  calDuration(section: Section): void {
    let countMedia = 0;
    const lectures = section.lectures || [];
    let duration = 0;
    lectures.forEach((item: Lecture) => {
      let lectureDuration = 0;
      item.medias.forEach((media: Media) => {
        countMedia++;
        if (media.mediaType === 'pdf') {
          duration += media.totalLength || 0;
          lectureDuration += media.totalLength || 0;
        } else {
          duration += media.media.duration;
          lectureDuration += media.media.duration;
        }
      });
      item.duration = lectureDuration;
    });
    section.duration = duration;
    if (this.course) {
      this.course.totalMedia = countMedia;
    }
  }

  openLecture(lecture: Lecture, iSection: number, iLecture: number): void {
    this.indexLecture = iLecture;
    this.indexSection = iSection;

    if (this.openFileId !== lecture._id) {
      this.openFileId = lecture._id;
    } else {
      this.openFileId = '';
    }
  }

  resetMediaPreview(): void {
    this.indexMedia = -1;
    this.shownItem = {
      title: 'Select a media to preview',
      type: '',
      url: null,
    };
  }

  returnDurationString(seconds: number): string {
    if (seconds == 0) return '0h:0m';
    else {
      var h, m, s: number;
      h = Math.floor(seconds / 3600);
      m = Math.floor((seconds - h * 3600) / 60);
      s = seconds - h * 3600 - m * 60;
      if (h > 0) {
        return h + 'h' + m + 'm';
      } else {
        return m + 'm' + s + 's';
      }
    }
  }

  viewMedia(
    lectureMedia: Media,
    iSection: number,
    iLecture: number,
    iMedia: number
  ): void {
    this.indexLecture = iLecture;
    this.indexSection = iSection;
    this.indexMedia = iMedia;

    const currentSection = this.sections[iSection];
    if (currentSection) {
      this.openLectureId = currentSection._id;

      const currentLecture = currentSection.lectures[iLecture];
      if (currentLecture) {
        this.openFileId = currentLecture._id;
      }
    }

    if (lectureMedia.mediaType === 'pdf') {
      this.shownItem.title = '';
    } else {
      this.shownItem.title =
        lectureMedia.media?.name || lectureMedia.name || 'Media';
    }

    this.shownItem.type = lectureMedia.mediaType;

    switch (lectureMedia.mediaType) {
      case 'pdf':
        if (lectureMedia.media && lectureMedia.media.fileUrl) {
          let pdfUrl = lectureMedia.media.fileUrl;
          const apiDomain = new URL(environment.apiUrl).hostname;
          if (pdfUrl.includes(apiDomain)) {
            const fileName = pdfUrl.split('/').pop();
            const apiBase = environment.apiUrl.replace('/v1', '');
            pdfUrl = `${apiBase}/files/${fileName}`;
          } else if (
            !pdfUrl.startsWith('http') &&
            !pdfUrl.startsWith('blob:')
          ) {
            const apiBase = environment.apiUrl.replace('/v1', '');
            pdfUrl = `${apiBase}${pdfUrl.startsWith('/') ? '' : '/'}${pdfUrl}`;
          }
          this.shownItem.url = pdfUrl;
        } else {
          this.utilService.toastError({
            title: 'Error',
            message: 'PDF file URL is missing or invalid',
          });
          this.shownItem.url = null;
        }
        break;

      case 'video':
      case 'audio':
        if (lectureMedia.media && lectureMedia.media.fileUrl) {
          this.shownItem.url = lectureMedia.media.fileUrl;
        } else {
          this.utilService.toastError({
            title: 'Error',
            message: 'Media file URL is missing or invalid',
          });
          this.shownItem.url = null;
        }
        break;
      default:
        this.utilService.toastError({
          title: 'Error',
          message: 'Unsupported media type: ' + lectureMedia.mediaType,
        });
        this.shownItem.url = null;
    }
  }

  approve(): void {
    if (window.confirm('Are you sure to approve this course?')) {
      this.courseService
        .approve(this.courseId)
        .pipe(
          catchError((err: any) => {
            this.utilService.toastError({
              title: 'Error',
              message: 'Something went wrong, please check and try again!',
            });
            return of(null);
          })
        )
        .subscribe((resp: any) => {
          if (!resp) return;

          if (this.course) {
            this.course.approved = true;
          }
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'Approve successfully',
          });
        });
    }
  }

  reject(): void {
    this.rejectModalVisible = true;
  }

  submitReject(): void {
    if (!this.rejectReason) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Please enter reason!',
      });
      return;
    }

    this.courseService
      .reject(this.courseId, { reason: this.rejectReason })
      .pipe(
        catchError((err) => {
          this.utilService.toastError({
            title: 'Error',
            message: 'Something went wrong, please try again!',
          });
          return of(null);
        })
      )
      .subscribe((resp: any) => {
        if (!resp) return;

        this.rejectModalVisible = false;
        if (this.course) {
          this.course.approved = false;
        }
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'Rejected course successfully',
        });
      });
  }

  handleRejectModalChange(event: boolean): void {
    this.rejectModalVisible = event;
  }
}
