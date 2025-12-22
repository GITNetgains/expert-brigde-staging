import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, PLATFORM_ID } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { ILecture, IMedia } from 'src/app/interface';
@Component({
  selector: 'app-lecture-modal',
  templateUrl: './lecture-modal.html',
  standalone: true,
  imports: [CommonModule, NgxExtendedPdfViewerModule]
})
export class LectureModalComponent {
  @Input() lecture: ILecture;
  @Input() media: IMedia;
  public isPlatform = false;

  constructor(public activeModal: NgbActiveModal, @Inject(PLATFORM_ID) private platformId: object) {
    if (isPlatformBrowser(this.platformId)) {
      console.log('asfawefafwafeaw');

      this.isPlatform = true;
    }
  }
}
