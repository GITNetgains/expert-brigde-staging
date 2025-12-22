import { ParticipantFormComponent } from '../modal-participants/participants-form';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IUser, IWebinar } from 'src/app/interface';
import {
  AppService,
  AuthService,
  STATE,
  SeoService,
  StateService,
  WebinarService
} from 'src/app/services';
declare let $: any;

@Component({
  selector: 'app-webinar-listing',
  templateUrl: './list.html'
})
export class WebinarListingComponent implements OnInit {
  public total = 0;
  public items: IWebinar[];
  public currentPage = 1;
  public pageSize = 10;
  public searchFields: any = {};
  public sortOption = {
    sortBy: 'createdAt',
    sortType: 'desc'
  };
  public currentUser: IUser;
  public fromItem = 0;
  public toItem = 0;
  public timeout: any;
  public config: any;
  public updating = false;
  constructor(
    private webinarService: WebinarService,
    private appService: AppService,
    private auth: AuthService,
    private seoService: SeoService,
    private modalService: NgbModal,
    public stateService: StateService
  ) {
    this.seoService.setMetaTitle('My Group Classes');
    this.config = this.stateService.getState(STATE.CONFIG);
  }

  ngOnInit() {
    this.auth.getCurrentUser().then((resp) => {
      this.currentUser = resp;
      if (this.currentUser._id) {
        this.query();
      }
    });
  }

  query() {
    this.webinarService
      .search({
        page: this.currentPage,
        take: this.pageSize,
        tutorId: this.currentUser._id,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
        ...this.searchFields
      })
      .then((resp) => {
        this.total = resp.data.count;
        this.items = resp.data.items;
        if (this.currentPage === 1) {
          this.fromItem = this.currentPage;
          this.toItem = this.items.length;
        } else if (this.currentPage > 1) {
          this.fromItem =
            this.currentPage * this.pageSize > this.total
              ? (this.currentPage - 1) * this.pageSize
              : this.currentPage * this.pageSize;
          this.toItem = this.fromItem + this.items.length;
        }
      })
      .catch(() => this.appService.toastError());
  }

  doSearch(evt: any) {
    const searchText = evt.target.value; // this is the search text
    if (this.timeout) {
      window.clearTimeout(this.timeout);
    }
    this.timeout = window.setTimeout(() => {
      this.searchFields.name = searchText;
      this.query();
    }, 400);
  }

  showChange(evt: any) {
    this.pageSize = evt.target.value;
    this.query();
  }

  sortBy(field: string, type: string) {
    this.sortOption.sortBy = field;
    this.sortOption.sortType = type;
    this.query();
  }

  onSort(evt: any) {
    this.sortOption = evt;
    this.query();
  }

  remove(item: any, index: number) {
    if (window.confirm('Are you sure to delete this webinar?')) {
      this.webinarService
        .delete(item._id)
        .then(() => {
          this.appService.toastSuccess('Item has been deleted!');
          this.items.splice(index, 1);
        })
        .catch((e) => this.appService.toastError(e));
    }
  }
  pageChange() {
    $('html, body').animate({ scrollTop: 0 });
    this.query();
  }

  showParticipants(webinar: any) {
    const modalRef = this.modalService.open(ParticipantFormComponent, {
      centered: true,
      backdrop: 'static',
      size: 'lg'
    });
    modalRef.componentInstance.webinarId = webinar._id;
  }

  changeStatus(webinar: IWebinar) {
    if (!this.updating) {
      this.updating = true;
      this.webinarService
        .changeStatus(webinar._id)
        .then(() => {
          webinar['disabled'] = !webinar.disabled;
          const message = webinar.disabled ? 'Disabled' : 'Enabled';
          this.appService.toastSuccess(message);
          this.updating = false;
        })
        .catch((err) => {
          this.updating = false;
          return this.appService.toastError(err);
        });
    }
  }
}
