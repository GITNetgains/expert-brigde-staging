import { Component, OnInit } from '@angular/core';
import { studentMenus, tutorMenus } from './menu';
import { STATE, SeoService, StateService } from 'src/app/services';
import { IUser } from 'src/app/interface';

@Component({
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  public type: string = '';
  public studentMenus = studentMenus;
  public tutorMenus = tutorMenus;
  currentUser: IUser;
  isLoading: boolean = true;

  // Premium color palette for icons
  private iconColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  ];

  constructor(private seoService: SeoService, public stateService: StateService) {
    this.seoService.setMetaTitle('Dashboard');
  }

  ngOnInit() {
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
    if (this.currentUser) {
      this.type = this.currentUser.type;
      this.isLoading = false;
    } else {
      // Handle case where user might be loaded asynchronously
      // For now, we assume if it's not in state, we wait or it re-renders when state updates
      // Just in case, set a timeout to disable loading if it's really stuck, or ideally subscribe to user changes
      // However keeping it simple as per original logic, just adding a check.
      this.isLoading = false;
    }
  }

  getIconBackground(index: number) {
    return this.iconColors[index % this.iconColors.length];
  }
}
