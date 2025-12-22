import {
  Component,
  Input,
  OnInit,
  inject,
  EventEmitter,
  Output,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { pick } from 'lodash-es';
import { environment } from 'src/environments/environment';
import { UtilService } from 'src/services';
import {
  videoMimeTypes,
  audioMimeTypes,
  documentMimeTypes,
} from 'src/constants';
import { FileUploadComponent } from 'src/components/common/uploader/uploader.component';
import { IconModule } from '@coreui/icons-angular';
import { cilTrash, cilFile, cilMediaPlay } from '@coreui/icons';
import {
  ButtonDirective,
  FormControlDirective,
  FormDirective,
  FormLabelDirective,
  ModalModule,
  ContainerComponent,
  RowComponent,
  ColComponent,
  FormModule,
  GridModule,
  FormFeedbackComponent,
  ButtonCloseDirective,
  BadgeComponent,
} from '@coreui/angular';
import { LectureMediaService } from 'src/services/lecture-media.service';

interface Media {
  _id: string;
  mediaType: string;
  media: {
    _id: string;
    name: string;
    duration?: number;
    fileUrl?: string;
  };
  totalLength?: number;
}

@Component({
  selector: 'app-lecture-form',
  templateUrl: './lecture-form.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormModule,
    GridModule,
    FormFeedbackComponent,
    ButtonDirective,
    ButtonCloseDirective,
    FormControlDirective,
    FormDirective,
    FormLabelDirective,
    ModalModule,
    FileUploadComponent,
    ContainerComponent,
    RowComponent,
    ColComponent,
    BadgeComponent,
    IconModule,
  ],
})
export class LectureFormComponent implements OnInit, OnDestroy, OnChanges {
  @Input() lecture: any = {};
  @Input() courseId: string = '';
  @Input() visible = false;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() modalClose = new EventEmitter<void>();

  private utilService = inject(UtilService);
  private lectureMediaService = inject(LectureMediaService);

  public maxFileSize: number = 1024;
  public submitted: boolean = false;
  public videoOptions: any = {};
  public pdfOptions: any = {};
  public audioOptions: any = {};
  public mediaType: string = 'video';
  public mediaOptions: any = {};
  public uploading: boolean = false;
  public lectureMedia: any = {
    mediaType: 'video',
  };
  public hashLecture: string = '';
  public medias: Media[] = [];
  icons = { cilTrash, cilFile, cilMediaPlay };

  ngOnInit() {
    if (this.lecture && this.lecture._id) {
      this.fetchLectureMedia();
    } else {
      this.generateHashLecture();
    }

    this.setupUploadOptions();
    this.lecture.courseId = this.courseId;

    document.addEventListener('modal-closed', this.resetUploaders.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener(
      'modal-closed',
      this.resetUploaders.bind(this)
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lecture'] && !changes['lecture'].firstChange) {
      const currentLecture = changes['lecture'].currentValue;

      if (currentLecture && currentLecture._id) {
        this.fetchLectureMedia();
      }
    }

    if (changes['visible'] && changes['visible'].currentValue === true) {
      if (this.lecture && this.lecture._id) {
        this.fetchLectureMedia();
      }
    }
  }

  private resetUploaders(): void {
    const timestamp = new Date().getTime();

    [this.videoOptions, this.audioOptions, this.pdfOptions].forEach(
      (options) => {
        if (options) {
          options.reset = true;
          options.id = `lecture-${
            options === this.videoOptions
              ? 'video'
              : options === this.audioOptions
              ? 'audio'
              : 'pdf'
          }-upload-${timestamp}`;
        }
      }
    );

    this.clearDOMElements([
      { selector: 'input[type="file"]', action: 'value', value: '' },
      { selector: '.file-list', action: 'innerHTML', value: '' },
      {
        selector: '.progress',
        action: 'style',
        property: 'display',
        value: 'none',
      },
      {
        selector: '.well.my-drop-zone',
        action: 'style',
        property: 'display',
        value: 'block',
      },
    ]);
    document.dispatchEvent(new CustomEvent('uploader-reset'));
  }

  private clearDOMElements(
    elements: Array<{
      selector: string;
      action: string;
      property?: string;
      value: string;
    }>
  ): void {
    elements.forEach(({ selector, action, property, value }) => {
      document.querySelectorAll(selector).forEach((element: any) => {
        if (element) {
          if (action === 'style' && property) {
            element.style[property] = value;
          } else {
            element[action] = value;
          }
        }
      });
    });
  }

  generateHashLecture(): void {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = 32;

    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    this.hashLecture = result;
  }

  fetchLectureMedia(): void {
    this.lectureMediaService
      .search({
        lectureId: this.lecture._id,
      })
      .subscribe({
        next: (resp: any) => {
          if (resp && resp.data && resp.data.items) {
            this.medias = resp.data.items.map((item: any) => {
              return {
                _id: item._id,
                mediaType: item.mediaType,
                media: {
                  _id: item.mediaId || (item.media ? item.media._id : ''),
                  name: item.media ? item.media.name : 'Media file',
                  duration: item.media ? item.media.duration : 0,
                  fileUrl: item.media ? item.media.fileUrl : '',
                },
                totalLength: item.totalLength || 0,
              };
            });
            if (!this.lecture.mediaIds) {
              this.lecture.mediaIds = [];
            }
          } else {
            this.medias = [];
          }
        },
        error: (err: any) => {
          console.error('Error fetching lecture media:', err);
          this.utilService.toastError({
            title: 'Error',
            message: 'Failed to load lecture media content',
          });
          this.medias = [];
        },
      });
  }

  setupUploadOptions(): void {
    this.videoOptions = {
      url: `${environment.apiUrl}/media/videos`,
      fileFieldName: 'file',
      id: 'lecture-video-upload',
      autoUpload: false,
      multiple: false,
      maxFileSize: this.maxFileSize * 1024 * 1024,
      allowedMimeType: videoMimeTypes,
      method: 'POST',
      hintText: 'Upload Video',
      uploadZone: true,
      onProgressItem: (fileItem: any, progress: number) => {
        this.uploading = true;
      },
      onCompleteItem: (item: any, response: any) => {
        try {
          const parsedResponse =
            typeof response === 'string' ? JSON.parse(response) : response;
          if (parsedResponse && parsedResponse.data) {
            this.createLectureMedia('video', parsedResponse.data._id);
            this.uploading = false;
          }
        } catch (e) {
          console.error('Error parsing response:', e);
          this.utilService.toastError({
            title: 'Error',
            message: 'Failed to process server response',
          });
        }
      },
    };

    this.audioOptions = {
      url: `${environment.apiUrl}/media/audios`,
      fileFieldName: 'file',
      id: 'lecture-audio-upload',
      autoUpload: false,
      multiple: false,
      maxFileSize: this.maxFileSize * 1024 * 1024,
      allowedMimeType: audioMimeTypes,
      method: 'POST',
      hintText: 'Upload Audio',
      uploadZone: true,
      onProgressItem: (fileItem: any, progress: number) => {
        this.uploading = true;
      },
      onCompleteItem: (item: any, response: any) => {
        try {
          const parsedResponse =
            typeof response === 'string' ? JSON.parse(response) : response;
          if (parsedResponse && parsedResponse.data) {
            this.createLectureMedia('audio', parsedResponse.data._id);
            this.uploading = false;
          }
        } catch (e) {
          console.error('Error parsing response:', e);
          this.utilService.toastError({
            title: 'Error',
            message: 'Failed to process server response',
          });
        }
      },
    };

    this.pdfOptions = {
      url: `${environment.apiUrl}/media/files`,
      fileFieldName: 'file',
      id: 'lecture-pdf-upload',
      autoUpload: false,
      multiple: false,
      maxFileSize: this.maxFileSize * 1024 * 1024,
      allowedMimeType: documentMimeTypes,
      method: 'POST',
      hintText: 'Upload PDF',
      uploadZone: true,
      onProgressItem: (fileItem: any, progress: number) => {
        this.uploading = true;
      },
      onCompleteItem: (item: any, response: any) => {
        try {
          const parsedResponse =
            typeof response === 'string' ? JSON.parse(response) : response;
          if (parsedResponse && parsedResponse.data) {
            this.createLectureMedia(
              'pdf',
              parsedResponse.data._id,
              this.lectureMedia.totalLength
            );
            this.uploading = false;
            this.lectureMedia.totalLength = 0;
          }
        } catch (e) {
          console.error('Error parsing response:', e);
          this.utilService.toastError({
            title: 'Error',
            message: 'Failed to process server response',
          });
        }
      },
    };
  }

  createLectureMedia(
    mediaType: string,
    mediaId: string,
    totalLength?: number
  ): void {
    const lectureMediaData = {
      lectureId: this.lecture._id || null,
      hashLecture: this.hashLecture,
      mediaType: mediaType,
      mediaId: mediaId,
      totalLength: totalLength || 0,
    };

    this.lectureMediaService.create(lectureMediaData).subscribe({
      next: (resp: any) => {
        if (resp && resp.data) {
          const newMedia = {
            _id: resp.data._id,
            mediaType: resp.data.mediaType,
            media: resp.data.media || {
              _id: resp.data.mediaId,
              name: 'Uploaded file',
              duration: 0,
            },
            totalLength: resp.data.totalLength || 0,
          };

          this.medias.push(newMedia);
          if (!this.lecture.mediaIds) {
            this.lecture.mediaIds = [];
          }

          if (this.lecture._id) {
            this.lecture.mediaIds.push(resp.data.mediaId);
          }
        }
      },
      error: (err: any) => {
        console.error('Error creating lecture media:', err);
        this.utilService.toastError({
          title: 'Error',
          message: 'Failed to save media to lecture',
        });
      },
    });
  }

  onUpload(event: number): void {
    this.lectureMedia.totalLength = event;
  }

  submit(frm: NgForm): void {
    this.submitted = true;
    if (!this.medias.length) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Please upload media content for lecture!',
      });
      return;
    }

    const lectureData = Object.assign(
      pick(this.lecture, [
        'courseId',
        'sectionId',
        'title',
        'description',
        'ordering',
        'mediaIds',
      ]),
      {
        hashLecture: this.hashLecture,
      }
    );

    this.formSubmit.emit(lectureData);
    this.closeModal();
  }

  checkMediaType(type: string): void {
    this.lectureMedia.mediaType = type;
    this.mediaType = type;
  }

  returnDuration(seconds: number): string {
    if (!seconds) return 'converting';
    if (seconds < 10) return '00:0' + seconds;

    let duration: string = '';
    if (seconds < 60) return '00:' + seconds;
    else {
      let hour: string | number = Math.floor(seconds / 3600);
      if (hour > 0) {
        if (hour < 10) hour = '0' + hour;
        duration = hour + ':';
      }

      const hourNum = typeof hour === 'string' ? parseInt(hour, 10) : hour;
      const remainSecond = seconds - hourNum * 3600;

      let minute: string | number = Math.floor(remainSecond / 60);
      if (minute < 10) minute = '0' + minute;

      let second: string | number = Math.floor(
        seconds -
          hourNum * 3600 -
          (typeof minute === 'string' ? parseInt(minute, 10) : minute) * 60
      );
      if (second < 10) second = '0' + second;
      return duration + minute + ':' + second;
    }
  }

  removeMedia(item: Media, index: number): void {
    if (window.confirm('Are you sure to delete this media content?')) {
      this.lectureMediaService.delete(item._id).subscribe({
        next: () => {
          this.medias.splice(index, 1);
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'Item has been deleted!',
          });
        },
        error: (err) => {
          console.error('Error deleting lecture media:', err);
          this.utilService.toastError({
            title: 'Error',
            message: err.data?.message || 'Failed to delete media content',
          });
        },
      });
    }
  }

  closeModal(): void {
    this.resetModal();
    this.visible = false;

    document.dispatchEvent(new CustomEvent('modal-closed'));
    this.modalClose.emit();
  }

  private resetModal(): void {
    if (!this.lecture._id) {
      this.medias = [];
      this.hashLecture = '';
      this.generateHashLecture();
    }

    Object.assign(this, {
      uploading: false,
      mediaType: 'video',
      lectureMedia: { mediaType: 'video' },
    });

    this.resetUploaders();
  }

  handleModalChange(event: boolean): void {
    this.visible = event;

    if (event && this.lecture?._id) {
      this.fetchLectureMedia();
    } else if (!event) {
      this.resetModal();
      document.dispatchEvent(new CustomEvent('modal-closed'));
      this.modalClose.emit();
    }
  }
}
