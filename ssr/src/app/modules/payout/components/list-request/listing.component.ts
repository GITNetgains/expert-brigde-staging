import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
declare let $: any;
import { IPayoutAccount, IPayoutRequest } from '../interface';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RequestPayoutModalComponent } from '../modal-request/modal-request.component';
import {
  AccountService,
  AppService,
  RequestPayoutService,
  STATE,
  SeoService,
  StateService
} from 'src/app/services';
import { IUser } from 'src/app/interface';
import { Color, LegendPosition, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-request-payout-listing',
  templateUrl: './listing.html'
})
export class ListingRequestComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  public items: IPayoutRequest[] = [];
  public page = 1;
  public take = 10;
  public total = 0;
  public tutorId: any;
  public dateChange: any = {};
  public searchFields: any = {};

  public payoutAccountId: any = '';
  public accounts: IPayoutAccount[] = [];
  public balance: IPayoutRequest;

  public sortOption = {
    sortBy: 'createdAt',
    sortType: 'desc'
  };
  public stats: any;
  public loading = false;
  config: any = {};
  // chart options
  single: any[];
  view: [number, number] = [700, 400];
  gradient = false;
  showLegend = true;
  showLabels = true;
  isDoughnut = false;
  legendPosition: LegendPosition.Below;
  colorScheme: Color = {
    name: 'myScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#5AA454', '#A10A28', '#C7B42C']
  };
  public loadingBalance = true;
  modalRef: NgbModalRef;
  tab = 'earning';
  currentUser: IUser;
  constructor(
    private payoutService: RequestPayoutService,
    private appService: AppService,
    private seoService: SeoService,
    public accountService: AccountService,
    private route: ActivatedRoute,
    private stateService: StateService,
    private modalService: NgbModal
  ) {
    this.seoService.setMetaTitle('Payout Request Manager');
    this.accounts = this.route.snapshot.data['account'];
  }

  ngOnInit() {
    this.config = this.stateService.getState(STATE.CONFIG);
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
    if (this.currentUser && this.currentUser._id) {
      this.tutorId = this.currentUser._id;
      this.queryStats();
      this.queryBalance({ tutorId: this.tutorId });
      this.query();
    }
  }

  query() {
    this.loading = true;
    this.payoutService
      .search({
        page: this.page,
        take: this.take,
        sort: `${this.sortOption.sortBy}`,
        sortType: `${this.sortOption.sortType}`,
        tutorId: this.tutorId,
        ...this.searchFields
      })
      .then((resp) => {
        this.items = resp.data.items;
        this.total = resp.data.count;
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
        this.appService.toastError();
      });
  }

  queryStats() {
    this.payoutService
      .stats({ tutorId: this.tutorId, ...this.dateChange })
      .then((resp) => {
        this.stats = resp.data;
      });
  }

  queryBalance(params: any) {
    this.loadingBalance = true;
    this.payoutService
      .getBalance(params)
      .then((resp) => {
        this.balance = resp.data;
        this.balance.balance = parseFloat(resp.data.balance.toFixed(2));
        this.balance.total = parseFloat(resp.data.total.toFixed(2));
        this.balance.commission = parseFloat(resp.data.commission.toFixed(2));
        this.single = Object.keys(this.balance).map((item) => {
          const name = `${item.toUpperCase()}`;
          return {
            name: name,
            value: this.balance[item as keyof IPayoutRequest],
            extra: {
              currency: this.config.currencySymbol
                ? this.config.currencySymbol
                : '$'
            }
          };
        });
        this.loadingBalance = false;
      })
      .catch((e) => {
        this.appService.toastError(e);
      });
  }

  formatTooltipText(data: any) {
    return `<span>${data.data.name}</br>${
      data.data.extra.currency + ' ' + data.value
    }</span>`;
  }

  sortBy(field: string, type: string) {
    this.sortOption.sortBy = field;
    this.sortOption.sortType = type;
    this.query();
  }

  dateChangeEvent(dateChange: any) {
    if (!dateChange) {
      if (this.dateChange.startDate && this.dateChange.toDate) {
        delete this.dateChange.startDate;
        delete this.dateChange.toDate;
      }
    } else {
      this.dateChange = {
        startDate: dateChange.from,
        toDate: dateChange.to
      };
    }
  }

  submitRequest() {
    this.modalRef = this.modalService.open(RequestPayoutModalComponent, {
      size: 'lg',
      centered: true
    });
    this.modalRef.componentInstance.balance = this.balance;
    this.modalRef.componentInstance.accounts = this.accounts;
    this.modalRef.result.then(
      (res) => {
        if (!res.payoutAccountId) {
          return this.appService.toastError('Please enter Payout Account Id');
        }
        this.payoutAccountId = res.payoutAccountId;
        this.payoutService
          .create({ payoutAccountId: this.payoutAccountId })
          .then((pRes: any) => {
            this.items.push(pRes.data);
            this.appService.toastSuccess('Your request has been sent.');
            // this.router.navigate(['/users/payout/request']);
          })
          .catch((err) => {
            this.appService.toastError(err);
          });
      },
      () => {
        return;
      }
    );
  }

  onSort(evt: any) {
    this.sortOption = evt;
    this.query();
  }

  pageChange() {
    $('html, body').animate({ scrollTop: 0 });
    this.query();
  }

  onTabSelect(tab: string) {
    this.tab = tab;
  }

  ngAfterViewInit() {
    this.view = [$('.chart-container').innerWidth() / 1.35, 400];
  }

  ngOnDestroy(): void {
    this.modalRef && this.modalRef.dismiss();
  }

  onResize(event: any) {
    this.view = [event.target.innerWidth / 1.35, 400];
  }
}
