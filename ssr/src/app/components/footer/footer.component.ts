import { Component, OnInit } from '@angular/core';
import { IStaticPage } from 'src/app/interface';
import {
  AuthService,
  STATE,
  StateService,
  StaticPageService
} from 'src/app/services';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  public staticPages: IStaticPage[] = [];
  public config: any = {};
  public isLoggedin: boolean = false;
  constructor(
    private authService: AuthService,
    private stateService: StateService,
    private staticPageService: StaticPageService
  ) {
    this.config = this.stateService.getState(STATE.CONFIG);
  }

  ngOnInit() {
    this.isLoggedin = this.authService.isLoggedin();
    this.staticPageService
      .getPages({ take: 99, isActive: true, sort: 'ordering', sortType: 'asc' })
      .then((resp) => {
        this.staticPages = resp.data.items;
      });
  }
}
