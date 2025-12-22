import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule, ButtonModule } from '@coreui/angular';
import { IUser } from 'src/interfaces/user.interface';
import { FileUploadComponent } from 'src/components/common/uploader/uploader.component';
import { IUploaderOptions } from 'src/interfaces';
import { IconModule, IconSetService } from '@coreui/icons-angular';
import { environment } from 'src/environments/environment';
import { imageMimeTypes } from 'src/constants';
import { Router, ActivatedRoute } from '@angular/router';
import { UtilService } from 'src/services/util.service';
import { MediaService } from 'src/services/media.service';

@Component({
  selector: 'app-profile-card',
  templateUrl: './profile-card.component.html',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    FileUploadComponent,
    IconModule,
  ],
  providers: [IconSetService],
})
export class ProfileCardComponent implements OnInit {
  @Input() user?: IUser;
  @Output() afterUpload = new EventEmitter<string>();
  maxFileSize = 15;
  previewUrl?: string;
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private utilService = inject(UtilService);
  isUploading = false;
  urlAvatar = '';
  attachments: any[] = [];

  public uploaderOptions!: IUploaderOptions;

  constructor(private mediaService: MediaService) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');

    if (userId) {
      this.urlAvatar = environment.apiUrl + '/users/' + userId + '/avatar';
    } else if (this.router.url !== '/users/profile/update') {
      this.urlAvatar = environment.apiUrl + '/admin/upload-avatar';
    } else {
      this.urlAvatar = environment.apiUrl + '/users/avatar';
    }

    this.uploaderOptions = {
      url: this.urlAvatar,
      autoUpload: false,
      multiple: false,
      fileFieldName: 'avatar',
      method: 'POST',
      uploadZone: true,
      allowedMimeType: imageMimeTypes,
      hintText: 'Choose Avatar',
      maxFileSize: this.maxFileSize * 1024 * 1024,
      onProgressItem: (fileItem, progress) => {
        // console.log(`Avatar upload progress: ${progress}%`);
        this.isUploading = true;
      },
      onCompleteItem: (item, response) => {
        try {
          if (response && response.data) {
            if (this.user) {
              this.user.avatarUrl =
                response.data.url || response.data.avatarUrl;
            }
            this.afterUpload.emit(response.data.avatar || this.user?.avatarUrl);
            this.utilService.toastSuccess({
              title: 'Success',
              message: 'Updated successfully'
            });
          }
        } catch (e) {
          console.error('Error processing response:', e);
        } finally {
          this.isUploading = false;
        }
      },
    };

    if (userId) {
      this.mediaService.search({ ownerId: userId, take: 50 }).subscribe({
        next: (resp) => {
          const items = resp?.data?.items || resp?.data || [];
          this.attachments = items;
        },
        error: () => {}
      });
    }
  }

  ngOnDestroy(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }
}
