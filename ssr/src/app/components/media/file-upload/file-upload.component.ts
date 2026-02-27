import { Component, OnInit, EventEmitter, Input, Output, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { HttpClient, HttpEventType, HttpHeaders, HttpEvent } from '@angular/common/http';
import { AppService, AuthService } from 'src/app/services';
import { environment } from 'src/environments/environment';
import { Observable, forkJoin } from 'rxjs';
import { map, last } from 'rxjs/operators';

interface QueueItem {
  file: File;
  progress: number;
  state: 'pending' | 'uploading' | 'done' | 'error';
  response?: any;
}

@Component({
  selector: 'app-file-upload',
  templateUrl: './upload.html',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
})
export class FileUploadComponent implements OnInit, AfterViewInit {
  @Input() options: any;
  @Output() finishUpload = new EventEmitter<any>();

  public hasBaseDropZoneOver = false;
  public queue: QueueItem[] = [];
  public multiple = false;
  public uploadOnSelect = false;
  public autoUpload = false;
  public totalLength = 0;
  private uploadedItems: any[] = [];

  // Expose a minimal uploader-like API for backward compatibility
  public uploader = {
    queue: this.queue,
    uploadAll: () => this.uploadAll(),
    clearQueue: () => this.clearQueue()
  };

  constructor(
    private authService: AuthService,
    private toasty: ToastrService,
    private translate: TranslateService,
    private appService: AppService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.multiple = !!(this.options && this.options.multiple);
    this.uploadOnSelect = !!(this.options && this.options.uploadOnSelect);
    this.autoUpload = !!(this.options && this.options.autoUpload);

    if (!this.options) {
      this.options = {};
    }

    // attach uploader compatibility object
    this.options.uploader = this.uploader;
  }

  ngAfterViewInit() {
    // nothing to do, kept for compatibility with previous lifecycle hooks
  }

  // ---------- File add helpers ----------

  private pushFileToQueue(file: File): boolean {
    // file size check (MB -> bytes)
    const maxMb = environment.maximumFileSize ?? 10;
    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      const msg = this.translate.instant('Maximum file size is 10 MB', { max: maxMb });
      this.toasty.error(msg);
      return false;
    }

    // accept filter
    if (this.options && this.options.accept) {
      const acceptOk = this.accept(file.type, this.options.accept);
      if (!acceptOk) {
        this.toasty.error(this.translate.instant('Invalid file type'));
        return false;
      }
    }

    const item: QueueItem = {
      file,
      progress: 0,
      state: 'pending'
    };

    // single-file mode: clear existing queue
    if (!this.multiple) {
      this.clearQueue();
    }

    this.queue.push(item);
    this.totalLength = this.queue.length;

    // notify with a copy so parent keeps the list when we clear the queue after upload
    if (this.options && this.options.onFileSelect) {
      try { this.options.onFileSelect([...this.queue]); } catch (e) {}
    }

    // auto upload
    if (this.options && this.options.uploadOnSelect) {
      this.uploadAll();
    } else if (this.autoUpload) {
      this.uploadAll();
    }

    return true;
  }

  // accept pattern like "image/*,application/pdf"
  accept(fileType: string, accept: any): boolean {
    if (!accept) { return true; }
    // produce a regex that matches any of the accept tokens
    const tokens: string[] = (typeof accept === 'string') ? accept.split(',').map(t => t.trim()) : (Array.isArray(accept) ? accept : []);
    // simple matching: exact match or wildcard
    for (const token of tokens) {
      if (token === '*/*') return true;
      if (token.endsWith('/*')) {
        const prefix = token.split('/')[0];
        if (fileType.startsWith(prefix + '/')) return true;
      } else {
        if (fileType === token) return true;
      }
    }
    return false;
  }

  // called from template when user selects using input[type=file]
  fileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) { return; }
    const files = Array.from(input.files);
    files.forEach(f => this.pushFileToQueue(f));
    // reset input so same file can be reselected later
    input.value = '';

    return true;
  }

  // called from template on drop
  fileDrop(event: DragEvent) {
    event.preventDefault();
    this.hasBaseDropZoneOver = false;
    const dt = event.dataTransfer;
    if (!dt) { return false; }
    const files = Array.from(dt.files);
    files.forEach(f => this.pushFileToQueue(f));
    return true;
  }

  fileOver(e: DragEvent) {
    e.preventDefault();
    this.hasBaseDropZoneOver = true;
  }

  fileLeave(e: DragEvent) {
    e.preventDefault();
    this.hasBaseDropZoneOver = false;
  }

  // ---------- Queue controls ----------

  clearQueue() {
    this.queue.length = 0;
    this.totalLength = 0;
  }

  // Upload a single QueueItem and return observable that completes on success
  private uploadQueueItem(item: QueueItem): Observable<any> {
    item.state = 'uploading';

    // choose endpoint based on MIME type (keep same behaviour)
    const type = item.file.type || '';
    let ep = 'files';
    if (type.indexOf('image') > -1) {
      ep = 'photos';
    } else if (type.indexOf('video') > -1) {
      ep = 'videos';
    }

    const url = (this.options && this.options.url) ? this.options.url : `${environment.apiBaseUrl}/media/${ep}`;

    const form = new FormData();
    const fieldName = this.options && this.options.fileFieldName ? this.options.fileFieldName : 'file';
    form.append(fieldName, item.file, item.file.name);

    // append custom fields if any
    if (this.options && this.options.customFields) {
      Object.keys(this.options.customFields).forEach(key => {
        form.append(key, this.options.customFields[key]);
      });
    }

    // append query params into URL if provided
    let uploadUrl = url;
    if (this.options && this.options.query) {
      const params = new URLSearchParams();
      Object.keys(this.options.query).forEach(k => params.append(k, this.options.query[k]));
      uploadUrl = `${url}?${params.toString()}`;
    }

    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + (this.authService.getAccessToken ? this.authService.getAccessToken() : '')
    });

    return this.http.post(uploadUrl, form, {
      headers,
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        // handle progress
        if (event.type === HttpEventType.UploadProgress) {
          const percent = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
          item.progress = percent;
          return { type: 'progress', percent, event };
        } else if (event.type === HttpEventType.Response) {
          return { type: 'response', body: event.body };
        } else {
          return { type: 'other', event };
        }
      }),
      // the caller will handle subscription/last -> response finalization
    );
  }

  // Upload all items in queue (sequentially)
  uploadAll() {
    if (!this.queue.length) {
      alert(this.translate.instant('Please select file'));
      return;
    }

    if (this.options?.lecturePdf && (!this.totalLength || this.totalLength <= 0)) {
      alert(this.translate.instant('Total length must be greater than 0!'));
      return;
    }

    if (this.options && this.options.onUploading) {
      try { this.options.onUploading(true); } catch (e) {}
    }
    // We will upload items sequentially so moment/ordering semantics are same as before
    const uploadObservables: Observable<any>[] = [];

    for (const q of this.queue) {
      // wrap each queue upload to final response
      const obs = this.uploadQueueItem(q).pipe(
        // map events into last value (HTTP response)
        last()
      );
      uploadObservables.push(obs);
    }

    // subscribe sequentially using forkJoin (parallel) or chained sequential approach.
    // To preserve order and reduce concurrency, we'll upload sequentially using async/await style via subscriptions.
    // Simpler approach: upload sequentially using recursion.
    this.uploadedItems = [];
    this.uploadSequential(0);
  }

  private uploadSequential(index: number) {
    if (index >= this.queue.length) {
      // finished all
      if (this.options && this.options.onUploadFinish) {
        try { this.options.onUploadFinish(this.uploadedItems); } catch (e) {}
      }
      if (this.options && this.options.onFinish) {
        try { this.options.onFinish(this.options.multiple ? this.uploadedItems : this.uploadedItems[0]); } catch (e) {}
      }
      if (this.options && this.options.onUploading) {
        try { this.options.onUploading(false); } catch (e) {}
      }
      this.finishUpload.emit(this.uploadedItems);
      // clear queue and reset progress (keeps previous behaviour where queue is cleared)
      this.clearQueue();
      this.uploadedItems = [];
      this.totalLength = 0;
      // notify parent so "chosen file" / "X is selected" can clear
      if (this.options && this.options.onFileSelect) {
        try { this.options.onFileSelect([]); } catch (e) {}
      }
      return;
    }

    const item = this.queue[index];
    item.state = 'uploading';
    // call uploadQueueItem and subscribe to events
    this.uploadQueueItem(item).subscribe({
      next: (ev: any) => {
        if (ev && ev.type === 'progress') {
          item.progress = ev.percent;
        } else if (ev && ev.type === 'response') {
          item.state = 'done';
          item.response = ev.body;
          this.uploadedItems.push(ev.body);
          // call per-item completion callback
          if (this.options && this.options.onCompleteItem) {
            try { this.options.onCompleteItem(ev.body); } catch (e) {}
          }
          // continue next
        }
      },
      error: (err: any) => {
        item.state = 'error';
        if (this.options && this.options.onError) {
          try { this.options.onError(err); } catch (e) {}
        } else {
          console.error('Upload error', err);
        }
        // continue to next even on error
        setTimeout(() => this.uploadSequential(index + 1), 50);
      },
      complete: () => {
        // move to next item
        setTimeout(() => this.uploadSequential(index + 1), 50);
      }
    });
  }
}
