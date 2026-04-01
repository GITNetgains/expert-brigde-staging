import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { studentMenus, tutorMenus } from './menu';
import { STATE, SeoService, StateService, AuthService } from 'src/app/services';
import { AppService } from 'src/app/services/app-service';
import { IUser } from 'src/app/interface';
import { Router } from '@angular/router';

@Component({
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit, AfterViewChecked {
  public type: string = '';
  public studentMenus = studentMenus;
  public tutorMenus = tutorMenus;
  currentUser: IUser;
  isLoading: boolean = true;
  showSearch: boolean = false; // Toggle search visibility

  // AI Search properties
  @ViewChild('searchTextarea') searchTextareaRef: ElementRef<HTMLTextAreaElement> | null = null;
  query: string = '';
  isRecording: boolean = false;
  recognition: any = null;
  private queryChanged = false;

  // Premium color palette for icons
  private iconColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  ];

  constructor(
    private seoService: SeoService,
    public stateService: StateService,
    private router: Router,
    private auth: AuthService,
    private app: AppService
  ) {
    this.seoService.setMetaTitle('Dashboard');
  }

  ngOnInit() {
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
    if (this.currentUser) {
      this.type = this.currentUser.type;
      this.isLoading = false;
    } else {
      this.isLoading = false;
    }

    this.initSpeechRecognition();
  }

  getIconBackground(index: number) {
    return this.iconColors[index % this.iconColors.length];
  }
isExternalLink(path: string | null): boolean {
  return !!path && (path.startsWith('http://') || path.startsWith('https://'));
}

  handleMenuClick(menu: any) {
    if (menu.key === 'menu-submit-new-project') {
      this.showSearch = !this.showSearch;
      if (this.showSearch) {
        // Focus textarea if opening
        setTimeout(() => {
          this.searchTextareaRef?.nativeElement.focus();
          this.resizeSearchInput();
        }, 100);
      }
    }
  }

  // AI Search Methods
  initSpeechRecognition() {
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

  onSearchKeydown(event: Event) {
    const e = event as KeyboardEvent;
    if (e.key !== 'Enter') return;
    if (e.shiftKey) return;
    event.preventDefault();
    if (this.query.trim()) this.onSearch(event);
  }

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
        this.query = '';
        return;
      }
    }
    const queryParams = { q: this.query };
    this.router.navigate(['/pages/ai-result'], { queryParams });
  }
}
