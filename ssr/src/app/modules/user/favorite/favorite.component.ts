import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IUser, IWebinar, ICourse } from 'src/app/interface';
import { SeoService, FavoriteService, AppService, STATE, StateService } from 'src/app/services';
declare let $: any;
@Component({
  templateUrl: 'favorite.html'
})
export class FavoriteComponent {
  public type: string;
  public page: any = 1;
  public pageSize = 9;
  public items: any = {
    tutor: [] as IUser[],
    webinar: [] as IWebinar[],
    course: [] as ICourse[]
  };
  public total: any = 0;
  public sortOption = {
    sortBy: 'createdAt',
    sortType: 'desc'
  };
  public loading = false;
  public haveResults = false;
  public config: any;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private seoService: SeoService,
    private favoriteService: FavoriteService,
    private appService: AppService,
    private stateService: StateService
  ) {
    this.seoService.setMetaTitle('My favorite');
    this.config = this.stateService.getState(STATE.CONFIG);
    this.route.params.subscribe((params) => {
      const urlType = params.type;
      // Redirect old URL segments to new ones (tutor→expert, groupclass→groupsession)
      if (urlType === 'tutor') {
        this.router.navigate(['/users/favorites', 'expert'], { replaceUrl: true });
        return;
      }
      if (urlType === 'groupclass') {
        this.router.navigate(['/users/favorites', 'groupsession'], { replaceUrl: true });
        return;
      }
      // URL uses expert/groupsession; API expects tutor/webinar
      this.type = urlType === 'expert' ? 'tutor' : urlType === 'groupsession' ? 'webinar' : urlType;
      this.query();
    });
  }

  reset() {
    this.page = 1;
    this.items.tutor = [];
    this.items.webinar = [];
    this.items.course = [];
    this.loading = false;
  }

  query() {
    this.reset();
    const params = Object.assign({
      page: this.page,
      take: this.pageSize,
      sort: this.sortOption.sortBy,
      sortType: this.sortOption.sortType
    });

    if (!this.loading) {
      if (this.type) {
        this.loading = true;
        this.favoriteService
          .search(params, this.type)
          .then((resp) => {
            if (
              resp &&
              resp.data &&
              resp.data.items &&
              resp.data.items.length
            ) {
              this.items[this.type] = resp.data.items;
              this.total = resp.data.count;
            }
            this.loading = false;
          })
          .catch(() => {
            this.loading = false;
            this.appService.toastError();
          });
      }
    }
  }
  pageChange() {
    $('html, body').animate({ scrollTop: 0 });
    this.query();
  }
}
