import { Component, Input, OnInit, inject, OnDestroy } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { UtilService, TutorService } from 'src/services';
import { HttpClient } from '@angular/common/http';
import {
  ButtonDirective,
  ModalModule,
  FormLabelDirective,
  FormControlDirective,
  FormCheckComponent,
  FormCheckLabelDirective,
  FormCheckInputDirective,
  ButtonCloseDirective,
} from '@coreui/angular';
import { FileUploadComponent } from 'src/components/common/uploader/uploader.component';
import { IUploaderOptions } from 'src/interfaces';
import { environment } from 'src/environments/environment';
import { documentMimeTypes, imageMimeTypes } from 'src/constants';

interface ICertificate {
  _id?: string;
  title?: string;
  description?: string;
  fromYear: number;
  toYear: number;
  verified?: boolean;
  documentId?: string;
  ordering?: number;
  tutorId?: string;
  document?: any;
  type?: string;
}

@Component({
  selector: 'app-add-certification',
  templateUrl: './add.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    ButtonDirective,
    FormLabelDirective,
    FormControlDirective,
    FormCheckComponent,
    FormCheckLabelDirective,
    FormCheckInputDirective,
    ButtonCloseDirective,
    ModalModule,
    FileUploadComponent,
  ],
})
export class AddCertificationComponent implements OnInit, OnDestroy {
  @Input() certificate: ICertificate | undefined;
  @Input() type: string | undefined;
  @Input() tutorId: string | undefined;
  @Input() visible = false;
  @Input() closeCallback: (result?: any) => void = () => {};

  public submitted = false;
  public maxFileSize = 1024;
  public options: Record<string, any> = {
    placeholderText: 'Enter description',
    charCounterCount: false,
    imageUpload: false,
  };
  public selectedFile: File | null = null;
  public uploadProgress = 0;
  public isUploading = false;
  public uploaderOptions: any = {};

  private utilService = inject(UtilService);
  private tutorService = inject(TutorService);
  private http = inject(HttpClient);

  ngOnInit() {
    if (!this.certificate) {
      this.certificate = {
        title: '',
        description: '',
        fromYear: 1900,
        toYear: 1900,
        verified: false,
        documentId: '',
        ordering: 0,
        tutorId: '',
        type: this.type || '',
        document: null,
      };
    }

    this.setupUploaderOptions();

    document.addEventListener('modal-closed', this.resetUploaders.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener(
      'modal-closed',
      this.resetUploaders.bind(this)
    );
  }

  setupUploaderOptions() {
    this.uploaderOptions = {
      url: environment.apiUrl + '/media/files',
      autoUpload: false,
      multiple: false,
      fileFieldName: 'file',
      method: 'POST',
      allowedMimeType: documentMimeTypes + ',' + imageMimeTypes,
      hintText: 'Choose Document',
      maxFileSize: this.maxFileSize * 1024 * 1024,
      id: 'certificate-document-upload',
      onProgressItem: (fileItem: any, progress: number) => {
        this.uploadProgress = progress;
        this.isUploading = true;
      },
      onProgressAll: (progress: number) => {
        this.uploadProgress = progress;
      },
      onCompleteItem: (item: any, response: any) => {
        try {
          const parsedResponse =
            typeof response === 'string' ? JSON.parse(response) : response;
          if (parsedResponse && parsedResponse.data) {
            if (this.certificate) {
              this.certificate.documentId = parsedResponse.data._id;
              this.certificate.document = parsedResponse.data;
            }
            this.utilService.toastSuccess({
              title: 'Success',
              message: 'File uploaded successfully',
            });
          }
        } catch (e) {
          console.error('Error processing response:', e);
          this.utilService.toastError({
            title: 'Error',
            message: 'Failed to upload file',
          });
        } finally {
          this.isUploading = false;
        }
      },
    };
  }

  private resetUploaders(): void {
    const timestamp = new Date().getTime();

    // Now that uploaderOptions is typed as 'any', we can use the reset property
    if (this.uploaderOptions) {
      this.uploaderOptions.reset = true;
      this.uploaderOptions.id = `certificate-document-upload-${timestamp}`;
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

  submit(frm: NgForm) {
    this.submitted = true;
    if (!frm.valid || !this.certificate) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Please complete the required fields!',
      });
      return;
    }

    if (!this.certificate.documentId) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Please upload document!',
      });
      return;
    }

    if (this.certificate.toYear < 1900 || this.certificate.fromYear < 1900) {
      this.utilService.toastError({
        title: 'Error',
        message: 'From year and to year must be greater than or equal to 1900!',
      });
      return;
    }

    if (
      this.certificate.ordering !== undefined &&
      this.certificate.ordering < 0
    ) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Ordering must be greater than or equal to 0!',
      });
      return;
    }

    if (this.certificate.toYear < this.certificate.fromYear) {
      this.utilService.toastError({
        title: 'Error',
        message: 'To year must be greater than from year!',
      });
      return;
    }

    this.certificate.tutorId = this.tutorId;
    this.certificate.type = this.type;

    const data = {
      title: this.certificate.title,
      description: this.certificate.description,
      fromYear: this.certificate.fromYear,
      toYear: this.certificate.toYear,
      type: this.certificate.type,
      documentId: this.certificate.documentId,
      tutorId: this.certificate.tutorId,
      verified: this.certificate.verified,
      ordering: this.certificate.ordering,
    };

    if (this.certificate._id) {
      this.tutorService
        .updateCertificate(this.certificate._id, data)
        .subscribe({
          next: (resp: any) => {
            this.closeModal(resp.data);
            this.utilService.toastSuccess({
              title: 'Success',
              message: 'Updated certificate successfully',
            });
          },
          error: (e: any) => {
            this.utilService.toastError({
              title: 'Error',
              message: 'Something went wrong, please try again!',
            });
          },
        });
    } else {
      this.tutorService.createCertificate(data).subscribe({
        next: (resp: any) => {
          this.closeModal(resp.data);
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'Created certificate successfully!',
          });
        },
        error: (e: any) => {
          this.utilService.toastError({
            title: 'Error',
            message: 'Something went wrong, please try again!',
          });
        },
      });
    }
  }

  closeModal(result?: any) {
    this.resetModal();
    this.visible = false;

    document.dispatchEvent(new CustomEvent('modal-closed'));
    if (result) {
      this.closeCallback(result);
    }
  }

  private resetModal(): void {
    if (!this.certificate?._id) {
      this.certificate = {
        title: '',
        description: '',
        fromYear: 1900,
        toYear: 1900,
        verified: false,
        documentId: '',
        ordering: 0,
        tutorId: this.tutorId || '',
        type: this.type || '',
        document: null,
      };
    }

    Object.assign(this, {
      submitted: false,
      isUploading: false,
      uploadProgress: 0,
      selectedFile: null,
    });

    this.resetUploaders();
  }

  handleModalChange(event: boolean) {
    this.visible = event;
    if (!event) {
      this.resetModal();
      document.dispatchEvent(new CustomEvent('modal-closed'));
      this.closeCallback();
    }
  }

  updateTitle(value: string) {
    if (this.certificate) {
      this.certificate.title = value;
    }
  }

  updateDescription(value: string) {
    if (this.certificate) {
      this.certificate.description = value;
    }
  }

  updateFromYear(value: number) {
    if (this.certificate) {
      this.certificate.fromYear = value;
    }
  }

  updateToYear(value: number) {
    if (this.certificate) {
      this.certificate.toYear = value;
    }
  }

  updateOrdering(value: number) {
    if (this.certificate) {
      this.certificate.ordering = value;
    }
  }

  updateVerified(value: boolean) {
    if (this.certificate) {
      this.certificate.verified = value;
    }
  }
}
