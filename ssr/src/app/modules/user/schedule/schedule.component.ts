import { Component, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RecurringFormComponent } from './recurring-schedule/modal-recurring/modal-recurring.component';
import { IUser } from 'src/app/interface';
import { ScheduleEditComponent } from 'src/app/components/calendar/schedule/schedule.component';
import { STATE, SeoService, StateService } from 'src/app/services';

@Component({
  templateUrl: './schedule.html'
})
export class ScheduleComponent {
  public tab = 'schedule';
  public tutor: IUser;
  public loading = false;

  @ViewChild('schedulePaid') schedulePaid: ScheduleEditComponent;
  @ViewChild('scheduleFree') scheduleFree: ScheduleEditComponent;
  constructor(
    private seoService: SeoService,
    private modalService: NgbModal,
    private stateService: StateService
  ) {
    this.seoService.setMetaTitle('My Schedule');
    this.tutor = this.stateService.getState(STATE.CURRENT_USER);
  }
  onTabSelect(tab: string) {
    this.tab = tab;
    if (tab === 'schedule') {
      setTimeout(() => {
        this.schedulePaid.reRender();
      }, 100);
    } else if (tab === 'free') {
      setTimeout(() => {
        this.scheduleFree.reRender();
      }, 100);
    }
  }

  onChange(isFree: boolean) {
    if (!isFree) {
      this.scheduleFree.loadStatic();
    } else {
      this.schedulePaid.loadStatic();
    }
  }

  addRecurring(isFree: boolean) {
    const recurringModalRef = this.modalService.open(RecurringFormComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });

    recurringModalRef.componentInstance.isFree = isFree;
    recurringModalRef.componentInstance.slotDuration = this.tutor.defaultSlotDuration;
    recurringModalRef.result.then(
      () => {
        this.scheduleFree.loadStatic();
        this.schedulePaid.loadStatic();
      },
      () => { return }
    );
  }
}
