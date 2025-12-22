// file-upload.component.ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { ProgressComponent } from '@coreui/angular';
import { cilCloudUpload, cilFile, cilTrash } from '@coreui/icons';
import { IconDirective, IconSetService } from '@coreui/icons-angular';
import { AuthService } from '@services/auth.service';
import { FileItem } from 'ng2-file-upload';

@Component({
  selector: 'app-file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss'],
  standalone: true,
  imports: [CommonModule, IconDirective, ProgressComponent],
  providers: [IconSetService]
})
export class FileListComponent implements OnInit {
  @Input() files!: FileItem[];
  @Output() onRemoveFile = new EventEmitter<FileItem>();

  public hasBaseDropZoneOver: boolean = false;
  public uploadStatus: string = '';
  public progress: number = 0;
  private iconSet = inject(IconSetService);
  public id!: string;
  constructor(private authService: AuthService) {
    this.iconSet.icons = {
      cilCloudUpload,
      cilTrash,
      cilFile
    };
  }
  // Initialize uploader with options

  ngOnInit(): void {
  }

  removeFile(file: FileItem) {
    const index = this.files.indexOf(file);
    if (index !== -1) {
      this.files.splice(index, 1);
      this.onRemoveFile.emit(file);
    }
  }
}