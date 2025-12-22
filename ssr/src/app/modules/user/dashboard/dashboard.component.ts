import { AfterViewInit, Component } from '@angular/core';
import { studentMenus, tutorMenus } from './menu';
import { chunk } from 'lodash';
import { STATE, SeoService, StateService } from 'src/app/services';
import { IUser } from 'src/app/interface';
@Component({
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements AfterViewInit {
  public type: any = '';
  public studentMenus = chunk(studentMenus, 4);
  public tutorMenus = chunk(tutorMenus, 4);
  currentUser: IUser;
  constructor(private seoService: SeoService, public stateService: StateService) {
    this.seoService.setMetaTitle('Dashboard');
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
    this.type = this.currentUser.type;
  }

  setBackgroundIcon(index: number) {
    return index % 2 == 0 ? '#f5b33f' : '#072e6f';
  }

  setColorIcon(index: number) {
    return index % 2 == 0 ? '#072e6f' : '#f5b33f';
  }

  setBg = () => {
    let randomColor = '';
    do {
      randomColor = Math.floor(Math.random() * 16777215).toString(16);
    } while (!CSS.supports('color', '#' + randomColor));

    return '#' + randomColor;
  };

  isColor(strColor: string) {
    const s = new Option().style;
    s.color = strColor;
    return s.color == strColor;
  }

  ngAfterViewInit() {
    switch (this.type) {
      case 'student':
        for (const menu of studentMenus) {
          if (menu.key) {
            const menuElement = document.getElementById(menu.key);
            if (menuElement) {
              menuElement.style.backgroundColor = this.setBg();
            }
          }
        }
        break;
      case 'tutor':
        for (const menu of tutorMenus) {
          if (menu.key) {
            const menuElement = document.getElementById(menu.key);
            if (menuElement) {
              menuElement.style.backgroundColor = this.setBg();
            }
          }
        }
        break;

      default:
        break;
    }
  }
}
