import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IUser } from 'src/app/interface';
import { AuthService, STATE, SeoService, StateService } from 'src/app/services';
@Component({
  templateUrl: './iframe.html',
  styleUrls: ['./lesson-page.scss']
})
export class LessonSpaceComponent implements OnInit {
  public tab: 'lesson-space' | 'browser' = 'lesson-space';
  public currentUser: IUser;
  public appointmentId: string;
  constructor(
    private seoService: SeoService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public stateService: StateService
  ) {
    this.seoService.setMetaTitle('My Lesson');
    this.appointmentId = this.route.snapshot.queryParams['appointmentId'];
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
  }

  async ngOnInit() {
    if (this.currentUser && this.authService.isLoggedin()) {
      const stored = localStorage.getItem('lessonSpaceUrl');
      if (stored && stored.indexOf('room.sh') > -1) {
        const iframe = document.getElementById('lessonspace') as HTMLElement;
        iframe.setAttribute('src', stored);
      }
    }
  }

  back() {
    if (this.currentUser && this.currentUser.type === 'tutor') {
      this.router.navigate(['/users/appointments']);
    } else if (this.currentUser && this.currentUser.type === 'student') {
      this.router.navigate(['/users/lessons']);
    }
  }
}
