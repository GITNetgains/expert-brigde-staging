import { ActivatedRoute } from '@angular/router';
import { OnInit, Component, Inject, PLATFORM_ID } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  ICourse,
  ILecture,
  ILectureMeida,
  IMyCourse,
  ISection,
  IStatsReview
} from 'src/app/interface';
import { AppService, MyCourseService, SectionService } from 'src/app/services';
import { MediaModalComponent } from 'src/app/components/media/media-modal/media-modal.component';
import { isPlatformBrowser } from '@angular/common';
import * as jQuery from 'jquery';

@Component({
  templateUrl: './detail.html'
})
export class MyCourseDetailComponent implements OnInit {
  public myCourseId: string;
  public courseId: string;
  public course: ICourse;
  public myCourse: IMyCourse;
  public sections: ISection[];
  public completedPercent = 0;
  public shownItem: any = {
    title: 'Introduction Video',
    type: 'video',
    url: ''
  };
  public optionsReview: any = {
    type: 'course',
    courseId: ''
  };
  public statsReview: IStatsReview = {
    ratingAvg: 0,
    ratingScore: 0,
    totalRating: 0
  };
  public indexSection = -1;
  public indexLecture = -1;
  public indexMedia = -1;
  public _zoomOut = false;
  public canNext = true;
  public canPrev = true;
  public openLectureId: string;
  public totalMedias: number;
  isPlatformBrowser = false;
  constructor(
    private route: ActivatedRoute,
    private myCourseService: MyCourseService,
    private sectionService: SectionService,
    private appService: AppService,
    private modalService: NgbModal,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.isPlatformBrowser = true;
    }
  }

  ngOnInit() {
    this.myCourseId = this.route.snapshot.paramMap.get('id') as string;
    this.myCourseService
      .findOne(this.myCourseId)
      .then((resp) => {
        this.myCourse = resp.data;
        this.courseId = resp.data.courseId;

        this.optionsReview.courseId = resp.data.courseId;
        this.course = resp.data.course;
        this.course.totalLecture = 0;
        this.course.totalLength = 0;
        this.course.totalMedia = 0;

        this.statsReview = {
          ...this.statsReview,
          ...{
            ratingAvg: this.course.ratingAvg,
            totalRating: this.course.totalRating,
            ratingScore: this.course.ratingScore
          }
        };

        this.shownItem.url = this.course.videoIntroduction.fileUrl;

        this.sectionService
          .search({
            courseId: this.courseId,
            take: 100,
            sort: 'ordering',
            sortType: 'asc'
          })
          .then((sectionResp: any) => {
            if (sectionResp.data) {
              this.sections = sectionResp.data.items;
              this.sections.map((item) => {
                this.calDuration(item);
                this.course.totalLength += item.duration;
                this.course.totalLecture += item.totalLecture;
                this.course.totalMedia += item.totalMedia;
              });
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
              if (this.course.totalMedia > 0)
                this.completedPercent = Math.ceil(
                  (this.myCourse.lectureMediaIdsCompleted.length /
                    this.course.totalMedia) *
                    100
                );
            }
          })
          .catch((err) => {
            this.appService.toastError(err);
          });
      })
      .catch((err) => {
        this.appService.toastError(err);
      });
  }

  returnDuration(seconds: number) {
    if (seconds == 0) return '00:00';
    else if (seconds < 10) return '00:0' + seconds;
    let duration = '';
    if (seconds < 60) return '00:' + seconds;
    else {
      let hour, second: any;
      hour = seconds < 3600 ? 0 : Math.floor(seconds / 3600);
      if (hour > 0) {
        if (hour < 10) hour = '0' + hour;
        duration = hour + ':';
      }
      const remainSecond = seconds - parseInt(hour as string) * 3600;
      const minute =
        Math.floor(remainSecond / 60) < 10
          ? '0' + Math.floor(remainSecond / 60)
          : Math.floor(remainSecond / 60);
      second =
        seconds - parseInt(hour as string) * 3600 - (minute as number) * 60;
      if (second < 10) second = '0' + second;
      return duration + minute + ':' + second;
    }
  }
  calDuration(section: ISection) {
    let countMedia = 0;
    const lectures = section.lectures || [];
    let duration = 0;
    lectures.forEach((item) => {
      let lectureDuration = 0;
      item.medias &&
        item.medias.forEach((media) => {
          countMedia++;
          if (media.mediaType === 'pdf') {
            duration += media.totalLength || 0;
            lectureDuration += media.totalLength || 0;
          } else {
            if (media.media) {
              duration += media.media.duration;
              lectureDuration += media.media.duration;
            }
          }
        });
      item.duration = lectureDuration;
    });
    section.duration = duration;
    section.totalMedia = countMedia;
  }

  returnDurationString(seconds: number) {
    if (seconds == 0) return '0h:0m';
    else {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds - h * 3600) / 60);
      const s = seconds - h * 3600 - m * 60;
      if (h > 0) {
        return h + 'h' + m + 'm';
      } else {
        return m + 'm' + s + 's';
      }
    }
  }

  openLecture(lecture: ILecture, iSection: number, iLecture: number) {
    this.indexLecture = iLecture;
    this.indexSection = iSection;
    if (lecture._id && this.openLectureId !== lecture._id) {
      this.openLectureId = lecture._id;
    } else this.openLectureId = '';
  }

  viewMedia(
    media: ILectureMeida,
    iSection: number,
    iLecture: number,
    iMedia: number
  ) {
    this.indexLecture = iLecture;
    this.indexSection = iSection;
    this.indexMedia = iMedia;
    if (this.myCourse && media._id && media.media) {
      this.shownItem.type = media.mediaType;
      this.shownItem.url = media.media.fileUrl;
      this.shownItem.title = media.media.name;
      if (!this.myCourse.lectureMediaIdsCompleted.includes(media._id)) {
        this.myCourse.lectureMediaIdsCompleted.push(media._id);
        this.completedPercent = Math.ceil(
          (this.myCourse.lectureMediaIdsCompleted.length /
            this.course.totalMedia) *
            100
        );

        if (this.completedPercent == 100) {
          this.myCourseService
            .complete(this.myCourseId)
            .then(() => {
              this.appService.toastSuccess(
                'You have completed this course. Check your profile to see the cerificate.'
              );
            })
            .catch((err) => {
              this.appService.toastError(err);
            });
        }

        const params = { lectureMediaId: media._id };
        this.myCourseService
          .updateProgress(this.myCourseId, params)
          .catch((err) => {
            this.appService.toastError(err);
          });
      }
    }
  }

  videoTrialVideo(section: ISection) {
    const { trialVideo } = section;
    if (trialVideo && trialVideo.fileUrl) {
      const modalRef = this.modalService.open(MediaModalComponent, {
        centered: true,
        backdrop: 'static',
        size: 'lg'
      });
      modalRef.componentInstance.media = {
        ...trialVideo,
        name: `${section.title} trailer video`
      };
    }
  }

  zoomOut() {
    this._zoomOut = !this._zoomOut;
  }

  next(iSection: number, iLecture: number, iMedia: number) {
    if (this.sections[iSection].lectures[iLecture].medias[iMedia + 1]) {
      this.viewMedia(
        this.sections[iSection].lectures[iLecture].medias[iMedia + 1],
        iSection,
        iLecture,
        iMedia + 1
      );
    } else {
      if (this.sections[iSection].lectures[iLecture + 1]) {
        this.viewMedia(
          this.sections[iSection].lectures[iLecture + 1].medias[0],
          iSection,
          iLecture + 1,
          0
        );
      } else {
        if (this.sections[iSection + 1].lectures[0])
          this.viewMedia(
            this.sections[iSection + 1].lectures[0].medias[0],
            iSection + 1,
            0,
            0
          );
      }
    }
  }

  prev(iSection: number, iLecture: number, iMedia: number) {
    if (iMedia !== 0) {
      this.viewMedia(
        this.sections[iSection].lectures[iLecture].medias[iMedia - 1],
        iSection,
        iLecture,
        iMedia - 1
      );
    } else {
      if (this.sections[iSection].lectures[iLecture - 1]) {
        this.viewMedia(
          this.sections[iSection].lectures[iLecture - 1].medias[
            this.sections[iSection].lectures[iLecture - 1].medias.length - 1
          ],
          iSection,
          iLecture - 1,
          this.sections[iSection].lectures[iLecture - 1].medias.length - 1
        );
        // this.viewMedia(
        //   this.sections[iSection].lectures[this.sections[iSection - 1].lectures.length - 1],
        //   iSection - 1,
        //   this.sections[iSection - 1].lectures.length - 1
        // );
      } else {
        if (
          this.sections[iSection - 1] &&
          this.sections[iSection - 1].lectures
        ) {
          const iNextSection = iSection - 1;
          const nextLecture =
            this.sections[iNextSection].lectures[
              this.sections[iNextSection].lectures.length - 1
            ];
          const nextMedia = nextLecture.medias[nextLecture.medias.length - 1];
          this.viewMedia(
            nextMedia,
            iNextSection,
            this.sections[iNextSection].lectures.length - 1,
            nextLecture.medias.length - 1
          );
        }
      }
    }
  }
}
