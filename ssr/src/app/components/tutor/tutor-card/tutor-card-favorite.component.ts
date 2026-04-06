import { Router } from '@angular/router';
import { Component, OnInit, Input, TemplateRef, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IUser } from 'src/app/interface';
import {
  AppService,
  AuthService,
  FavoriteService,
  LanguageService,
  ConversationService,
  STATE,
  StateService
} from 'src/app/services';
import { PlatformConfigService } from 'src/app/services/platform-config.service';
@Component({
  selector: 'app-tutor-card-favorite',
  templateUrl: './tutor-card-favotite.html',
  styleUrls: ['./style.scss']
})
export class TutorCardFavoriteComponent implements OnInit {
  @Input() tutor: IUser;
  @Input() config: any;
  public isLoggedin: boolean;
  @Input() currentUser: IUser;
  @ViewChild('introVideoTpl') introVideoTpl: TemplateRef<any>;
  public videoUrl: any;
  public introVideoUrl: string | null = null;
  avatarOptions: any = {};
  public effectiveCommissionRate = 0;
  public gstRate = 0;

  constructor(
    private authService: AuthService,
    private tutorFavoriteService: FavoriteService,
    public languageService: LanguageService,
    public router: Router,
    private stateService: StateService,
    private platformConfig: PlatformConfigService,
    private appService: AppService,
    private conversationService: ConversationService,
    private sanitizer: DomSanitizer,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    if (this.authService.isLoggedin()) {
      this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
      this.isLoggedin = true;
    }
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

  favorite() {
    if (!this.currentUser)
      this.appService.toastError('Please Log in to add to your favorites');
    else {
      const params = Object.assign(
        {
          tutorId: this.tutor._id,
          type: 'tutor'
        },
        {}
      );
      this.tutorFavoriteService
        .favorite(params, 'tutor')
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
            'Removed from your favorite expert list successfully!'
          );
        })
        .catch(() => this.appService.toastError());
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
}
