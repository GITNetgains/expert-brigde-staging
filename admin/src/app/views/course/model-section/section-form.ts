import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  EventEmitter,
  Output,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { pick } from 'lodash-es';
import { environment } from 'src/environments/environment';
import { UtilService } from 'src/services';
import { videoMimeTypes } from 'src/constants';
import { FileUploadComponent } from 'src/components/common/uploader/uploader.component';

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
} from '@coreui/angular';

@Component({
  selector: 'app-section-form',
  templateUrl: './section-form.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonDirective,
    FormDirective,
    FormControlDirective,
    FormLabelDirective,
    ModalModule,
    FileUploadComponent,
    ContainerComponent,
    RowComponent,
    ColComponent,
    FormModule,
    GridModule,
    FormFeedbackComponent,
    ButtonCloseDirective,
  ],
})
export class SectionFormComponent implements OnInit, OnChanges {
  @Input() section: any = {};
  @Input() visible = false;
  @Output() formSubmit = new EventEmitter<any>();
  @Output() modalClose = new EventEmitter<void>();

  private utilService = inject(UtilService);

  public submitted: boolean = false;
  public videoOptions: any;
  public uploading: boolean = false;
  public videoSelected: any[] = [];
  public videoUrl: string = '';
  public maxFileSize: number = 15;

  ngOnInit() {
    this.videoUrl = this.section.trialVideo
      ? this.section.trialVideo.fileUrl
      : null;
    this.setupVideoOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && changes['visible'].currentValue === true) {
      if (this.section?._id) {
        this.videoUrl = this.section.trialVideo?.fileUrl || '';
      }
    }
  }

  private setupVideoOptions(): void {
    this.videoOptions = {
      url: `${environment.apiUrl}/media/videos`,
      fileFieldName: 'file',
      id: 'section-video-trial',
      autoUpload: false,
      multiple: false,
      maxFileSize: this.maxFileSize * 1024 * 1024,
      allowedMimeType: videoMimeTypes,
      method: 'POST',
      hintText: 'Upload Video',
      onProgressItem: (fileItem: any, progress: number) => {
        // console.log(`Video progress: ${progress}%`);
        this.uploading = true;
      },
      onCompleteItem: (item: any, response: any) => {
        this.handleVideoUploadComplete(response);
      },
    };
  }

  private handleVideoUploadComplete(response: any): void {
    try {
      const parsedResponse =
        typeof response === 'string' ? JSON.parse(response) : response;

      if (parsedResponse?.data) {
        this.section.trialVideoId = parsedResponse.data._id;
        this.videoUrl = parsedResponse.data.fileUrl;
        this.uploading = false;
        // console.log('Video uploaded successfully', parsedResponse.data);
      }
    } catch (e) {
      console.error('Error parsing response:', e);
      this.utilService.toastError({
        title: 'Error',
        message: 'Failed to process server response',
      });
      this.uploading = false;
    }
  }

  submit(frm: NgForm): void {
    this.submitted = true;

    if (!frm.valid || this.section.ordering < 0) {
      return this.utilService.toastError({
        title: 'Error',
        message: 'Please complete the required fields!',
      });
    }

    const sectionData = pick(this.section, [
      'title',
      'description',
      'ordering',
      'trialVideoId',
    ]);

    this.formSubmit.emit(sectionData);
    this.closeModal();
  }

  private resetUploader(): void {
    if (this.videoOptions) {
      this.videoOptions = {
        ...this.videoOptions,
        reset: true,
        id: `section-video-trial-${new Date().getTime()}`,
      };
    }
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

  private resetModal(): void {
    if (!this.section._id) {
      this.section = {};
      this.videoUrl = '';
    }

    Object.assign(this, {
      submitted: false,
      uploading: false,
      videoSelected: [],
    });

    this.resetUploader();
  }

  closeModal() {
    this.resetModal();
    this.visible = false;

    document.dispatchEvent(new CustomEvent('modal-closed'));
    this.modalClose.emit();
  }

  handleModalChange(event: boolean) {
    this.visible = event;
    if (event && this.section?._id) {
      this.videoUrl = this.section.trialVideo?.fileUrl || '';
    } else if (!event) {
      this.resetModal();
      document.dispatchEvent(new CustomEvent('modal-closed'));
      this.modalClose.emit();
    }
  }
}
