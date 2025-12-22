import { Component, Input, OnInit } from '@angular/core';
import { FileIconComponent } from '../icons/file-icon/file-icon.component';

@Component({
  selector: 'app-preview',
  standalone: true,
  templateUrl: './preview.component.html',
  imports: [FileIconComponent],
})
export class PreviewComponent implements OnInit {
  @Input() media: any;

  customClass = {};

  ngOnInit() {
    if (!this.media) {
      return;
    }

    if (
      this.media.type === 'video' ||
      (this.media.mimeType && this.media.mimeType.indexOf('video') > -1)
    ) {
      this.customClass = {
        'fa-video-camera': true,
      };
    } else {
      this.customClass = {
        'fa-file': true,
      };
    }
  }
}
