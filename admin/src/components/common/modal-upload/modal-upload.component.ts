import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ButtonCloseDirective,
  ButtonDirective,
  ColComponent,
  FormControlDirective,
  FormDirective,
  FormLabelDirective,
  GutterDirective,
  ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  RowComponent,
  Tabs2Module,
  TooltipDirective,
} from '@coreui/angular';
import { MediaService } from '@services/media.service';
import { UtilService } from '@services/util.service';
import { imageMimeTypes } from 'src/constants';
import { environment } from 'src/environments/environment';
import { IUploaderOptions } from 'src/interfaces';
import { AppPaginationComponent } from '../pagination/pagination.component';
import { FileUploadComponent } from '../uploader/uploader.component';
import { PreviewComponent } from '../preview/preview.component';
import { CommonModule } from '@angular/common';
import { FileIconComponent } from '../icons/file-icon/file-icon.component';
@Component({
  selector: 'app-modal-upload',
  standalone: true,
  templateUrl: './modal-upload.component.html',
  imports: [
    CommonModule,
    ButtonDirective,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ButtonCloseDirective,
    ModalBodyComponent,
    ModalFooterComponent,
    Tabs2Module,
    FileUploadComponent,
    RowComponent,
    ColComponent,
    AppPaginationComponent,
    GutterDirective,
    FormControlDirective,
    FormLabelDirective,
    FormsModule,
    FormDirective,
    PreviewComponent,
    FileIconComponent,
    TooltipDirective,
  ],
})
export class ModalUploadComponent {
  @Input() options: any;
  @Input() item: any;
  @Input() field: string = '';
  @Output() selectFileUrl = new EventEmitter<string>();

  visible = false;
  page: number = 1;
  keyword: any = {
    name: '',
    description: '',
  };
  files: any[] = [];
  totalMedia: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  count: number = 0;
  activeEditMedia: any = {};

  private mediaService = inject(MediaService);
  private toasty = inject(UtilService);

  loadLibrary() {
    this.mediaService
      .search(
        Object.assign(
          {
            page: this.currentPage,
            take: this.pageSize,
          },
          this.options?.query ?? {},
          this.keyword
        )
      )
      .subscribe({
        next: (resp) => {
          this.files = resp.data.items;
          this.totalMedia = resp.data.count;
        },
        error: () => {
          this.toasty.toastError({
            title: 'Error',
            message: 'Something went wrong, please try again!',
          });
        },
      });
  }

  onPageChanged(page: number) {
    this.currentPage = page;
    this.loadLibrary();
  }

  selectToEdit(media: any) {
    this.activeEditMedia = media;
  }

  openMediaModal() {
    this.loadLibrary();
    this.visible = true;
  }

  closeMediaModal() {
    this.visible = false;
  }

  handleLiveDemoChange(event: any) {
    this.visible = event;
  }

  public uploadOptions: IUploaderOptions = {
    url: environment.apiUrl + '/media/photos',
    autoUpload: false,
    multiple: false,
    fileFieldName: 'file',
    onCompleteItem: (item, response) => {
      // console.log(
      //   `File ${item.file.name} uploaded successfully`,
      //   response.data
      // );
    },
    allowedMimeType: imageMimeTypes,
    hintText: 'Drop or click to select file',
    maxFileSize: 200 * 1024 * 1024,
    uploadZone: true,
  };

  getUploadOptions(item: any): IUploaderOptions {
    return {
      id: this.field,
      url: environment.apiUrl + '/media/photos',
      autoUpload: false,
      multiple: false,
      fileFieldName: 'file',
      onCompleteItem: (fileItem, response) => {
        if (this.field) {
          item.value[this.field] = response.data.fileUrl;
        } else {
          item.value = response.data.fileUrl;
        }
      },
      allowedMimeType: imageMimeTypes,
      hintText: 'Upload Image',
      maxFileSize: 200 * 1024 * 1024,
    };
  }

  select(media: any) {
    this.selectFileUrl.emit(this.activeEditMedia.thumbUrl);
    this.visible = !this.visible;
  }

  update(frm: any) {
    if (frm.invalid) {
      frm.markAllAsTouched();
      return;
    }

    this.mediaService
      .update(this.activeEditMedia._id, {
        name: frm.value.name,
        description: frm.value.description,
      })
      .subscribe({
        next: () => {
          this.toasty.toastSuccess({
            title: 'Success',
            message: 'Updated',
          });
        },
        error: (err) => {
          this.toasty.toastError({
            title: 'Error',
            message: err?.error?.message || 'Something went wrong!',
          });
        },
      });
  }
}
