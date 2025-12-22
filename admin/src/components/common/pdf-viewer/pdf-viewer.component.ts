import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PdfViewerConfig {
  height?: string;
  useBrowserLocale?: boolean;
  showToolbar?: boolean;
  showSidebarButton?: boolean;
  showFindButton?: boolean;
  showPagingButtons?: boolean;
  showZoomButtons?: boolean;
  showPresentationModeButton?: boolean;
  showOpenFileButton?: boolean;
  showPrintButton?: boolean;
  showDownloadButton?: boolean;
  showSecondaryToolbarButton?: boolean;
  showRotateButton?: boolean;
  showHandToolButton?: boolean;
  showPropertiesButton?: boolean;
  listenToURL?: boolean;
  zoom?: number | string;
}

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
  imports: [CommonModule, NgxExtendedPdfViewerModule],
})
export class PdfViewerComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private apiBaseUrl = environment.apiUrl;

  @Input() set src(value: string | ArrayBuffer | Blob | Uint8Array) {
    if (value && typeof value === 'string') {
      const apiDomain = new URL(this.apiBaseUrl).hostname;
      try {
        if (typeof value === 'string' && value.includes(apiDomain)) {
          const fileName = value.split('/').pop();
          const apiBase = this.apiBaseUrl.replace('/v1', '');
          const apiPdfUrl = `${apiBase}/files/${fileName}`;
          this.fetchExternalPdf(apiPdfUrl);
        } else {
          const url = new URL(value);
          this.pdfSrc = url.href;
        }
      } catch (e) {
        this.pdfSrc = value;
      }
    } else {
      this.pdfSrc = value;
    }
    if (this.pdfSrc) {
      setTimeout(() => { }, 100);
    }
  }

  @Input() config: PdfViewerConfig = {};

  @Output() pdfLoaded = new EventEmitter<any>();
  @Output() pdfLoadingFailed = new EventEmitter<any>();
  @Output() pageChanged = new EventEmitter<number>();
  @Output() annotationAdded = new EventEmitter<any>();
  @Output() annotationRemoved = new EventEmitter<any>();
  @Output() annotationEdited = new EventEmitter<any>();

  pdfSrc: string | ArrayBuffer | Blob | Uint8Array | null = null;
  defaultConfig: PdfViewerConfig = {
    height: '80vh',
    useBrowserLocale: true,
    showToolbar: true,
    showSidebarButton: true,
    showFindButton: true,
    showPagingButtons: true,
    showZoomButtons: true,
    showPresentationModeButton: true,
    showOpenFileButton: false,
    showPrintButton: true,
    showDownloadButton: true,
    showSecondaryToolbarButton: true,
    showRotateButton: true,
    showHandToolButton: true,
    showPropertiesButton: true,
    listenToURL: false,
    zoom: 'auto',
  };

  get mergedConfig(): PdfViewerConfig {
    return { ...this.defaultConfig, ...this.config };
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  onPdfLoaded(event: any): void {
    this.pdfLoaded.emit(event);
  }

  onPdfLoadingFailed(event: any): void {
    this.pdfLoadingFailed.emit(event);
  }

  onPageChanged(page: number): void {
    this.pageChanged.emit(page);
  }

  onAnnotationAdded(event: any): void {
    this.annotationAdded.emit(event);
  }

  onAnnotationRemoved(event: any): void {
    this.annotationRemoved.emit(event);
  }

  onAnnotationEdited(event: any): void {
    this.annotationEdited.emit(event);
  }

  exportAnnotations(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        resolve([]);
      } catch (error) {
        reject(error);
      }
    });
  }

  importAnnotations(annotations: any[]): void {
  }

  downloadPdf(): void {
    if (this.pdfSrc && typeof this.pdfSrc === 'string') {
      const link = document.createElement('a');
      link.href = this.pdfSrc;
      link.download = 'document.pdf';
      link.click();
    }
  }

  printPdf(): void {
    window.print();
  }

  private fetchExternalPdf(url: string): void {
    this.pdfSrc = url;
  }
}
