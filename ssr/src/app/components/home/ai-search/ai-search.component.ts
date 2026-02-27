import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services';
import { AppService } from 'src/app/services/app-service';

@Component({
  selector: 'app-ai-search',
  templateUrl: './ai-search.component.html',
  styleUrls: ['./ai-search.component.scss'],
})
export class AiSearchComponent implements OnInit, AfterViewChecked {
  @Input() config: any;
  @ViewChild('searchTextarea') searchTextareaRef: ElementRef<HTMLTextAreaElement> | null = null;

  query: string = '';
  isRecording: boolean = false;
  recognition: any = null;
  private queryChanged = false;

  constructor(private router: Router, private auth: AuthService, private app: AppService) {}

  ngOnInit() {
    if (!this.app.isBrowser) return;
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isRecording = true;
      };

      this.recognition.onresult = (event: any) => {
        this.query = event.results[0][0].transcript;
        this.queryChanged = true;
      };

      this.recognition.onend = () => {
        this.isRecording = false;
      };
    }
  }

  /** Enter = submit, Shift+Enter = new line (ChatGPT-style) */
  onSearchKeydown(event: Event) {
    const e = event as KeyboardEvent;
    if (e.key !== 'Enter') return;
    if (e.shiftKey) return;
    event.preventDefault();
    if (this.query.trim()) this.onSearch(event);
  }

  /** Auto-grow textarea height with content (ChatGPT-style, not single-line overflow) */
  resizeSearchInput() {
    if (!this.app.isBrowser) return;
    const el = this.searchTextareaRef?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    const newHeight = Math.min(el.scrollHeight, 200);
    el.style.height = newHeight + 'px';
  }

  ngAfterViewChecked() {
    if (this.queryChanged && this.app.isBrowser) {
      this.queryChanged = false;
      setTimeout(() => this.resizeSearchInput(), 0);
    }
  }

  toggleRecording() {
    if (!this.recognition) {
      alert('Voice recognition is not supported on this browser.');
      return;
    }

    this.isRecording
      ? this.recognition.stop()
      : this.recognition.start();
  }

  async onSearch(event: Event) {
    event.preventDefault();
    if (!this.query.trim()) return;
    if (this.auth.isLoggedin()) {
      const current = await this.auth.getCurrentUser();
      const isTutor = current && current.type === 'tutor';
      if (isTutor) {
        this.app.toastError('Experts cannot post queries.');
        return;
      }
    }
    const queryParams = { q: this.query };
    this.router.navigate(['/pages/ai-result'], { queryParams });
  }
}
