// file-upload.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { ButtonDirective } from '@coreui/angular';
import { cilCloudUpload } from '@coreui/icons';
import { IconDirective, IconSetService } from '@coreui/icons-angular';
import { AuthService } from '@services/auth.service';
import { FileUploader, FileItem, ParsedResponseHeaders, FileUploadModule } from 'ng2-file-upload';
import { IUploaderOptions } from 'src/interfaces';
import { FileListComponent } from './file-list/file-list.component';

@Component({
  selector: 'app-file-uploader',
  templateUrl: './uploader.component.html',
  styleUrls: ['./uploader.component.scss'],
  standalone: true,
  imports: [FileUploadModule, CommonModule, ButtonDirective, IconDirective, FileListComponent],
  providers: [IconSetService],
})
export class FileUploadComponent implements OnInit {
  @Input() options!: IUploaderOptions;
  public uploader: FileUploader = new FileUploader({
    url: ''
  });;

  public hasBaseDropZoneOver: boolean = false;
  public uploadStatus: string = '';
  public progress: number = 0;
  private iconSet = inject(IconSetService);
  public id!: string;
  public files!: FileItem[];
  public uploadedFiles: Array<{name: string, response: any, originalFile: FileItem}> = [];
  private resetListener?: () => void;
  constructor(private authService: AuthService) {
    this.iconSet.icons = {
      cilCloudUpload
    };
  }
  // Initialize uploader with options

  ngOnInit(): void {
    this.uploader = new FileUploader({
      url: this.options.url,
      authToken: 'Bearer ' + this.authService.getAccessToken(),
      autoUpload: this.options.autoUpload || false,
      maxFileSize: this.options.maxFileSize || 100 * 1024 * 1024, // Default 100 MB,
      method: this.options.method || 'POST',
      itemAlias: this.options.fileFieldName || 'file',
      allowedMimeType: this.options.allowedMimeType ? this.options.allowedMimeType.split(',') : [],
      queueLimit: 10,
      removeAfterUpload: false // Keep items in queue to show success state
    });

    // Success handler
    this.uploader.onCompleteItem = (
      item: FileItem,
      response: string,
      _status: number,
      _headers: ParsedResponseHeaders
    ) => {
      this.uploadStatus = `File ${item.file.name} uploaded successfully`;
      const resp = JSON.parse(response);

      // Store uploaded file for display
      this.uploadedFiles.push({
        name: item.file.name || 'Unknown file',
        response: resp,
        originalFile: item
      });

      if (this.options.onCompleteItem) {
        this.options.onCompleteItem(item, resp);
      }
    };

    this.uploader.onCompleteAll = () => {
      this.uploadStatus = 'All files uploaded successfully';
      // Reset file input after all files are uploaded
      this.resetFileInput();
      // Don't clear the queue - let files remain to show success state
      // Files will be cleared when user manually removes them or starts a new upload
    }

    // Error handler
    this.uploader.onErrorItem = (
      item: FileItem,
      response: string,
      _status: number,
      _headers: ParsedResponseHeaders
    ) => {
      this.uploadStatus = `Failed to upload ${item.file.name}: ${response}`;
    };

    // Progress handler
    this.uploader.onProgressItem = (item: FileItem, progress: any) => {
      item.progress = progress;
      if (this.options.onProgressItem) {
        this.options.onProgressItem(item, progress);
      }
    };

    this.uploader.onProgressAll = (progress: any) => {
      this.uploadStatus = `Overall progress: ${progress}%`;
      this.progress = progress;
      if (this.options.onProgressAll) {
        this.options.onProgressAll(progress);
      }
    };

    // File add validation
    this.uploader.onWhenAddingFileFailed = (_item, filter) => {
      let message = '';
      switch (filter.name) {
        case 'fileSize':
          message = 'File is too large (max 10MB)';
          break;
        case 'mimeType':
          message = 'Invalid file type (only PNG, JPEG, PDF allowed)';
          break;
        case 'queueLimit':
          message = 'Maximum 10 files allowed';
          break;
        default:
          message = 'Error adding file';
      }
      this.uploadStatus = message;
    };
  }



  ngAfterViewInit() {
    this.uploader.onAfterAddingFile = item => (item.withCredentials = false);
  }

  // Handle drag over
  public fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  public fileDrop(e: any): void {
    this.hasBaseDropZoneOver = e;
    if (e && e.length) {
      this.uploader.addToQueue(e);
      this.uploadStatus = `${e.length} file(s) added to queue`;
    }
  }

  // Remove single file
  public removeFile(item: FileItem): void {
    // Remove from uploader queue
    const index = this.uploader.queue.indexOf(item);
    if (index !== -1) {
      this.uploader.queue.splice(index, 1);
    }
    // Reset file input to allow re-selection of the same file
    this.resetFileInput();
    this.uploadStatus = 'File removed';
  }

  // Remove uploaded file
  public removeUploadedFile(uploadedFile: {name: string, response: any, originalFile: FileItem}): void {
    const index = this.uploadedFiles.indexOf(uploadedFile);
    if (index !== -1) {
      this.uploadedFiles.splice(index, 1);
      this.uploadStatus = `Uploaded file ${uploadedFile.name} removed`;
    }
  }

  // Clear all files
  public clearQueue(): void {
    this.uploader.clearQueue();
    this.uploadStatus = 'Queue cleared';
    // Reset file input to allow re-selection of the same files
    this.resetFileInput();
  }

  // Handle file selection
  public onFileSelected(event: FileList): void {
    if (event && event.length) {
      if (!this.options.multiple) {
        this.files = [];
        this.uploader.clearQueue();
        this.uploadedFiles = []; // Clear previous uploads for single file mode
      }

      // Convert FileList to Array and add to queue
      const filesArray = Array.from(event);

      // Check if files with same names already exist and remove them first
      const newFileNames = filesArray.map(f => f.name);
      const itemsToRemove = this.uploader.queue.filter(item =>
        item.file.name && newFileNames.includes(item.file.name)
      );
      itemsToRemove.forEach(item => {
        const index = this.uploader.queue.indexOf(item);
        if (index !== -1) {
          this.uploader.queue.splice(index, 1);
        }
      });

      this.uploader.addToQueue(filesArray);
      this.files = this.uploader.queue;
      this.uploadStatus = `${event.length} file(s) selected`;

      // Auto upload if enabled
      if (this.options.autoUpload) {
        setTimeout(() => this.uploadAll(), 100);
      }

      // Reset input after processing to allow re-selection
      setTimeout(() => this.resetFileInput(), 0);
    }
  }

  // Upload all files
  public uploadAll(): void {
    if (this.uploader.queue.length) {
      this.uploader.uploadAll();
      this.uploadStatus = 'Uploading files...';
    } else {
      this.uploadStatus = 'No files in queue';
    }
  }

  // Reset file input element to allow re-selection of the same file
  private resetFileInput(): void {
    // Get all file input elements in the component
    const fileInputs = document.querySelectorAll(`#${this.options.id || 'file-upload'}`) as NodeListOf<HTMLInputElement>;
    fileInputs.forEach(input => {
      if (input && input.type === 'file') {
        input.value = '';
      }
    });
  }
}
