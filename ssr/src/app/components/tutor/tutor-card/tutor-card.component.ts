import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
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
  @ViewChild('introVideoTpl') introVideoTpl: TemplateRef<any>;
  public videoUrl: any;

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

  ngOnInit() {
    this.isLoggedin = this.authService.isLoggedin();
    const id = (this.tutor as any).introYoutubeId || (this.tutor as any).idYoutube;
    if (id) {
      this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}`);
    }
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
            'Added to your favorite tutor list successfully!'
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
    this.router.navigate(['/appointments', this.tutor.username], {
      queryParams: { isFree: true }
    });
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
    if (!this.videoUrl) return;
    this.modalService.open(this.introVideoTpl, { centered: true });
  }
}
