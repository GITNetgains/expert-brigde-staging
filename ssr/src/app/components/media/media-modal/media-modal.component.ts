import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { IMedia } from 'src/app/interface';
@Component({
  selector: 'app-media-modal',
  templateUrl: './media-modal.html',
  standalone: true,
  imports: [CommonModule, NgxExtendedPdfViewerModule]
})
export class MediaModalComponent {
  @Input() media: IMedia;
  constructor(public activeModal: NgbActiveModal) { }
}
