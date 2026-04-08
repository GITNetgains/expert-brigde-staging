import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TemplateRef, ViewChild } from '@angular/core';
import {
  Component,
  OnInit,
  Input,
  HostListener,
  ElementRef,
  Output,
  EventEmitter
} from '@angular/core';

import { IUser } from 'src/app/interface';
import {
  AppService,
  AuthService,
  FavoriteService,
  LanguageService,
  ConversationService
} from 'src/app/services';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlatformConfigService } from 'src/app/services/platform-config.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-tutor-card',
  templateUrl: './tutor-card.html',
  styleUrls: ['style.scss']
})
export class TutorCardComponent implements OnInit {
  @Input() tutor: IUser;
  @Input() config: any;
  public isLoggedin: boolean;
  @Input() currentUser: IUser;
  @Input() isBorder: boolean;
  @Input() assessmentInfo: { hasAssessment: boolean; tier?: string | null; verification_level?: string } | null = null;
  @ViewChild('introVideoTpl') introVideoTpl: TemplateRef<any>;
  public videoUrl: any;
  public introVideoUrl: string | null = null;
  /** When true, full bio is shown in the card (no navigation). */
  public bioExpanded = false;
  public effectiveCommissionRate = 0;
  public gstRate = 0;

  /** Share profile (same URL pattern as expert detail page) */
  public webUrl = environment.url;
  public copied = false;

  @Output() hover = new EventEmitter();
  constructor(
    private authService: AuthService,
    private tutorFavoriteService: FavoriteService,
    private appService: AppService,
    public languageService: LanguageService,
    public router: Router,
    private elementRef: ElementRef,
    private conversationService: ConversationService,
    private sanitizer: DomSanitizer,
    private platformConfig: PlatformConfigService,
    private modalService: NgbModal
  ) {}

  @HostListener('mouseenter') onMouseEnter() {
    const element = this.elementRef.nativeElement;
    const rect = element.getBoundingClientRect();
    this.hover.emit({ top: rect.top, tutor: this.tutor });
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.hover.emit({ top: null, tutor: null });
  }

  toggleBioExpanded(): void {
    this.bioExpanded = !this.bioExpanded;
  }

  /** Sanitized bio for safe HTML rendering (line breaks + simple markdown bold **text**) */
  get sanitizedBio(): SafeHtml {
    const bio = this.tutor?.bio || '';
    if (!bio) return this.sanitizer.bypassSecurityTrustHtml('');
    let html = String(bio)
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  ngOnInit() {
    this.isLoggedin = this.authService.isLoggedin();
    // Compute effective commission with MIN floor + GST
    const rawCommission = (this.tutor as any)?.commissionRate ?? this.config?.commissionRate ?? 0;
    this.effectiveCommissionRate = Math.max(typeof rawCommission === "number" ? rawCommission : parseFloat(rawCommission) || 0, this.platformConfig.getMinCommission());
    this.gstRate = this.platformConfig.getGstRate();
    
    // YouTube Video
    const id = (this.tutor as any).introYoutubeId || (this.tutor as any).idYoutube;
    if (id) {
      this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}`);
    }

    // Direct Video File
    const introVideo: any = this.tutor.introVideo;
    if (introVideo && (introVideo.fileUrl || introVideo.originalPath || introVideo.filePath)) {
      this.introVideoUrl =
        introVideo.fileUrl ||
        introVideo.mediumUrl ||
        introVideo.thumbUrl ||
        introVideo.originalPath ||
        introVideo.filePath;
    }
  }

  get isVerified(): boolean {
    return this.assessmentInfo?.verification_level === 'verified';
  }

  getTierLabel(): string {
    if (!this.assessmentInfo?.hasAssessment) return '';
    const labels: { [key: string]: string } = {
      'A': 'Top Expert',
      'B': 'Verified Expert',
      'C': 'Qualified Expert',
      'D': 'Developing Expert'
    };
    return labels[this.assessmentInfo.tier || ''] || '';
  }

  favorite() {
    if (!this.currentUser)
      this.appService.toastError('Please Log in to add to your favorites');
    else {
      this.tutorFavoriteService
        .favorite(
          {
            tutorId: this.tutor._id,
            type: 'tutor'
          },
          'tutor'
        )
        .then(() => {
          this.tutor.isFavorite = true;
          this.appService.toastSuccess(
            'Added to your favorite expert list successfully!'
          );
        })
        .catch(() => this.appService.toastError());
    }
  }

  unFavorite() {
    if (!this.currentUser)
      this.appService.toastError('Please loggin to use this feature!');
    else {
      this.tutorFavoriteService
        .unFavorite(this.tutor._id || '', 'tutor')
        .then(() => {
          this.tutor.isFavorite = false;
          this.appService.toastSuccess(
            'Removed from your favorite expert list successfully.'
          );
        })
        .catch(() => this.appService.toastError('Unable to remove from favorites.'));
    }
  }

  bookFree() {
    this.router.navigate(['/experts', this.tutor.username, 'booking']);
  }

  chat() {
    if (!this.authService.isLoggedin()) {
      return this.appService.toastError('Please login to send message');
    }
    this.conversationService
      .create(this.tutor._id)
      .then((resp) => {
        this.conversationService.setActive(resp.data);
        this.router.navigate(['/users/conversations']);
      })
      .catch(() => this.appService.toastError('You cannot send messages to yourself.'));
  }

  openIntro() {
    if (!this.videoUrl && !this.introVideoUrl) {
      // If no video, navigate to profile as fallback
      this.router.navigate(['/experts', this.tutor._id]);
      return;
    }
    this.modalService.open(this.introVideoTpl, { centered: true, size: 'lg' });
  }

  getShareProfileUrl(): string {
    return `${this.webUrl}/experts/${this.tutor?._id}`;
  }

  shareProfile(): void {
    const url = this.getShareProfileUrl();

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.copied = true;
        this.appService.toastSuccess('Profile link copied!');
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        this.copied = true;
        this.appService.toastSuccess('Profile link copied!');
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      } catch {
        /* ignore */
      }
      document.body.removeChild(textArea);
    }
  }

  shareOnFacebook(): void {
    const u = encodeURIComponent(this.getShareProfileUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, '_blank');
  }

  shareOnTwitter(): void {
    const u = encodeURIComponent(this.getShareProfileUrl());
    window.open(`https://twitter.com/intent/tweet?url=${u}`, '_blank');
  }
}
