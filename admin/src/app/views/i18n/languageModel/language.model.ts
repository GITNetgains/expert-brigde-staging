import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { ReactiveFormsModule, FormsModule, NgForm } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { ModalModule } from '@coreui/angular';
import { LanguageService } from '@services/i18nLanguage.service';
import { FileUploadComponent } from '@components/common/uploader/uploader.component';
import { environment } from 'src/environments/environment';
import { jsonMimeTypes } from 'src/constants';
import { pick } from 'lodash-es';
import {
  CardHeaderComponent,
  FormControlDirective,
  FormLabelDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  ColComponent,
} from '@coreui/angular';
import { IUploaderOptions } from 'src/interfaces';
import { UtilService } from '@services/util.service';

@Component({
  selector: 'app-languages-model',
  templateUrl: './languages.model.html',
  imports: [
    ModalModule,
    NgSelectComponent,
    FormControlDirective,
    FormLabelDirective,
    ButtonDirective,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    ColComponent,
    ReactiveFormsModule,
    FormsModule,
    FileUploadComponent,
    CommonModule,
  ],
})
export class LanguagesModalComponent implements OnInit {
  @Input() visible = false;
  @ViewChild('frm') formRef!: NgForm;
  @ViewChild('fileUploader') fileUploaderRef!: FileUploadComponent;

  public selectedLang: any = null;
  @Input() lang: any = {
    isDefault: false,
    isActive: false,
    name: '',
    key: '',
    flag: '',
    countryCode: '',
    jsonId: null,
  };
  @Output() modalClose = new EventEmitter<void>();
  public isoLangs: any = {};
  public uploadOptions: any = {};
  public submitted: Boolean = false;

  constructor(
    private languageService: LanguageService,
    private utilService: UtilService
  ) {}

  ngOnInit(): void {
    this.uploadOptions = {
      url: environment.apiUrl + '/media/files',
      id: 'main-image-upload',
      autoUpload: false,
      allowedMimeType: jsonMimeTypes,
      multiple: false,
      fileFieldName: 'file',
      uploadZone: true,
      onProgressItem: (fileItem: any, progress: number) => {
        // console.log(`File ${fileItem.file.name} progress: ${progress}%`);
      },
      onProgressAll: (progress: number) => {
        // console.log(`Overall progress: ${progress}%`);
      },
      onCompleteItem: (item: any, response: any) => {
        // console.log(
        //   `File ${item.file.name} uploaded successfully`,
        //   response.data
        // );
        this.lang.jsonId = response.data._id;
        if (!this.lang.jsonId) {
          this.lang.jsonId = response.data._id;
        }
      },
      hintText: 'Upload json file',
      maxFileSize: 200 * 1024 * 1024,
    };
    // console.log(this.lang);
    this.isoLangs = this.languageService.isoLangs.map((item) =>
      Object.assign(item, {
        text: item.name + ' - ' + item.language.name,
      })
    );
  }

  create(frm: any) {
    this.submitted = true;

    if (this.lang._id) {
      this.languageService
        .update(
          this.lang._id,
          pick(this.lang, [
            'isDefault',
            'isActive',
            'key',
            'name',
            'flag',
            'jsonId',
            'countryCode',
          ])
        )
        .subscribe({
          next: (resp: any) => {
            this.utilService.toastSuccess({
              title: 'Success',
              message: 'Language updated successfully',
            });
            this.closeModal();
          },
          error: (err: any) => {
            this.utilService.toastError({
              title: 'Error',
              message: err.data?.message || 'Failed to update language',
            });
            this.closeModal;
          },
        });
    } else {
      this.languageService.create(this.lang).subscribe((resp) => {
        this.utilService.toastSuccess({
          title: 'success',
          message: 'upload language success',
        });
      });
      this.closeModal();
    }
  }

  clearForm() {
    // Reset form data
    this.lang = this.getEmptyLang();
    this.selectedLang = null;
    this.submitted = false;

    // Reset form validation state
    if (this.formRef) {
      this.formRef.resetForm();
      // Force reset form state
      setTimeout(() => {
        this.formRef.form.markAsUntouched();
        this.formRef.form.markAsPristine();
      });
    }

    // Clear file uploader if exists
  }

  getEmptyLang() {
    return {
      isDefault: false,
      isActive: false,
      name: '',
      key: '',
      flag: '',
      countryCode: '',
      jsonId: null,
    };
  }

  changeLang(event: any) {
    // console.log(event);
    if (event) {
      this.lang.name = event.language.code.toUpperCase();
      this.lang.key = event.language.code;
      this.lang.flag = event.flag;
      this.lang.countryCode = event.code;
    }
  }

  closeModal(): void {
    this.clearForm();
    this.modalClose.emit();
    this.resetUploader();
  }

  handleModalChange(event: boolean): void {
    if (this.lang && this.lang._id) {
      // Modal opening with existing data - don't clear
    } else if (!event) {
      // Modal closing - clear form
      this.clearForm();
      this.modalClose.emit();
    }
  }

  resetUploader() {
    try {
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input: any) => {
        if (input && input.value) {
          input.value = '';
        }
      });
      const fileLists = document.querySelectorAll('.file-list');
      fileLists.forEach((fileList: any) => {
        if (fileList) {
          fileList.innerHTML = '';
        }
      });
      const progressBars = document.querySelectorAll('.progress');
      progressBars.forEach((progressBar: any) => {
        if (progressBar) {
          progressBar.style.display = 'none';
        }
      });
      if (this.uploadOptions) {
        this.uploadOptions = {
          ...this.uploadOptions,
          reset: true,
          id: `lecture-video-upload-${new Date().getTime()}`,
        };
      }
    } catch (err) {
      // console.error('Error resetting uploader:', err);
    }
  }
}
