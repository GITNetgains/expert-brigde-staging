import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { pick } from 'lodash';
import { AppService, LectureMediaService } from 'src/app/services';
import { ILectureMeida } from 'src/app/interface';
import { environment } from 'src/environments/environment';
import { randomHash } from 'src/app/lib';
@Component({
  selector: 'app-lecture-form',
  templateUrl: './lecture-form.html'
})
export class LectureFormComponent implements OnInit {
  @Input() lecture = { mediaIds: [] } as any;
  @Input() courseId: string;
  public maxFileSize: number;
  public submitted = false;
  public videoOptions: Object = {};
  public pdfOptions: Object = {};
  public audioOptions: Object = {};
  public mediaType = 'video';
  public mediaOptions: Object = {};
  public uploading = false;
  public lectureMedia: any = {
    mediaType: 'video'
  };
  public hashLecture = '';
  public medias: ILectureMeida[] = [];
  constructor(
    private appService: AppService,
    private lectureMediaService: LectureMediaService,
    public activeModal: NgbActiveModal
  ) {
    this.maxFileSize = environment.maximumFileSize;
  }

  ngOnInit() {
    // if (!this.lecture._id) this.lecture.mediaType = 'video';
    if (this.lecture._id)
      this.lectureMediaService
        .search({ lectureId: this.lecture._id })
        .then((resp) => {
          this.medias = resp.data.items;
        });
    else {
      this.hashLecture = randomHash(32, '');
    }
    this.videoOptions = {
      url: environment.apiBaseUrl + '/media/videos',
      fileFieldName: 'file',
      onFinish: (resp: any) => {
        this.lectureMediaService
          .create({
            lectureId: this.lecture._id || null,
            hashLecture: this.hashLecture,
            mediaType: 'video',
            mediaId: resp.data._id
          })
          .then((res) => {
            this.medias.push(res.data);
            if (this.lecture._id) this.lecture?.mediaIds.push(res.data._id);
            this.uploading = false;
          });
      },
      id: 'video-upload',
      accept: 'video/*',
      onUploading: () => (this.uploading = true)
    };

    this.audioOptions = {
      url: environment.apiBaseUrl + '/media/audios',
      fileFieldName: 'file',
      onFinish: (resp: any) => {
        this.lectureMediaService
          .create({
            lectureId: this.lecture._id || null,
            hashLecture: this.hashLecture,
            mediaType: 'audio',
            mediaId: resp.data._id
          })
          .then((res) => {
            this.medias.push(res.data);
            if (this.lecture._id) this.lecture.mediaIds.push(res.data._id);
            this.uploading = false;
          });
      },
      id: 'audio-upload',
      accept: 'audio/*',
      onUploading: () => (this.uploading = true)
    };

    this.pdfOptions = {
      url: environment.apiBaseUrl + '/media/files',
      fileFieldName: 'file',
      onFinish: (resp: any) => {
        this.lectureMediaService
          .create({
            lectureId: this.lecture._id || null,
            hashLecture: this.hashLecture,
            mediaType: 'pdf',
            mediaId: resp.data._id,
            totalLength: this.lectureMedia.totalLength
          })
          .then((res) => {
            this.medias.push(res.data);
            if (this.lecture._id) this.lecture.mediaIds.push(res.data._id);
            this.uploading = false;
            this.lectureMedia.totalLength = 0;
          });
      },
      lecturePdf: true,
      id: 'pdf-upload',
      accept: '.pdf',
      onUploading: () => (this.uploading = true)
    };
    // if (this.lecture.mediaType) this.mediaType = this.lecture.mediaType;
    this.lecture.courseId = this.courseId;
  }

  onUpload(event: any) {
    this.lectureMedia.totalLength = event;
  }
  submit(frm: any) {
    if (!frm.valid) {
      return this.appService.toastError('Invalid form, please try again.');
    }
    this.submitted = true;
    if (!this.medias.length)
      this.appService.toastError('Please upload media content for lecture!');
    else
      this.activeModal.close(
        Object.assign(
          pick(this.lecture, [
            'courseId',
            'sectionId',
            'title',
            'description',
            'ordering',
            'mediaIds'
          ]),
          {
            hashLecture: this.hashLecture
          }
        )
      );
  }

  checkMediaType(type: string) {
    this.lectureMedia.mediaType = type;
    this.mediaType = type;
  }
  returnDuration(seconds: number) {
    if (seconds == 0) return 'converting';
    else if (seconds < 10) return '00:0' + seconds;
    let duration = '';
    if (seconds < 60) return '00:' + seconds;
    else {
      let hour, second;
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

  removeMedia(item: any, index: number) {
    if (window.confirm('Are you sure to delete this media content?')) {
      this.lectureMediaService
        .delete(item._id)
        .then(() => {
          this.appService.toastSuccess('Item has been deleted!');
          this.medias.splice(index, 1);
        })
        .catch((e) => this.appService.toastError(e));
    }
  }
}
