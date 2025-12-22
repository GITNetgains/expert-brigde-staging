import { Router } from '@angular/router';
import { Component, OnInit, Input } from '@angular/core';
import { IUser } from 'src/app/interface';
import {
  AppService,
  AuthService,
  FavoriteService,
  LanguageService,
  STATE,
  StateService
} from 'src/app/services';
@Component({
  selector: 'app-tutor-card-favorite',
  templateUrl: './tutor-card-favotite.html'
  //   styleUrls: ['style.scss']
})
export class TutorCardFavoriteComponent implements OnInit {
  @Input() tutor: IUser;
  @Input() config: any;
  public isLoggedin: boolean;
  @Input() currentUser: IUser;
  avatarOptions: any = {};

  constructor(
    private authService: AuthService,
    private tutorFavoriteService: FavoriteService,
    public languageService: LanguageService,
    public router: Router,
    private stateService: StateService,
    private appService: AppService
  ) {}

  ngOnInit() {
    if (this.authService.isLoggedin()) {
      this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
      this.isLoggedin = true;
    }
    this.isLoggedin = this.authService.isLoggedin();
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
            'Removed from your favorite tutor list successfully!'
          );
        })
        .catch(() => this.appService.toastError());
    }
  }

  bookFree() {
    const queryParams = {
      isFree: true
    };
    this.router.navigate(['/appointments', this.tutor.username], {
      queryParams: queryParams
    });
  }
}
