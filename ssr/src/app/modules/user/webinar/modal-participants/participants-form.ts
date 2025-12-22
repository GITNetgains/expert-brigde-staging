import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import chunk from 'lodash/chunk';
import { WebinarService } from 'src/app/services';

@Component({
  selector: 'app-participants-form',
  templateUrl: './participants-form.html'
})
export class ParticipantFormComponent implements OnInit {
  @Input() webinarId: string;
  public participants = [] as any[];
  public loading = false;
  public chunks = [] as any;

  constructor(private webinarService: WebinarService, public activeModal: NgbActiveModal) { }

  ngOnInit() {
    this.loading = true;
    this.webinarService.getEnrolledList(this.webinarId).then((resp: any) => {
      if (resp.data && resp.data.items && resp.data.items.length) {
        this.participants = resp.data.items.map((item: any) => item.user);
      }

      if (this.participants.length > 11) {
        this.chunks = chunk(this.participants, 11);
      }
      this.loading = false;
    });
  }
}
