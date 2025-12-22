import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IMylesson } from 'src/app/interface';
import { AppointmentService, AppService } from 'src/app/services';

@Component({
  selector: 'app-report-form',
  templateUrl: './form.html'
})
export class ReportFormComponent implements OnInit {
  @Input() appointment: IMylesson;
  @Output() doReport = new EventEmitter();
  reportData: any = { issue: '' };
  reportSending = false;
  constructor(
    private appointmentService: AppointmentService,
    private appService: AppService
  ) {}

  ngOnInit() {
    if (this.appointment) {
      this.reportData.targetId = this.appointment._id;
      this.reportData.targetType = this.appointment.targetType;
    }
  }

  report() {
    if (!this.reportData.issue) {
      return this.appService.toastError('Please enter issue');
    }
    this.reportSending = true;
    this.appointmentService
      .report(this.reportData)
      .then((resp) => {
        this.reportSending = false;
        this.appService.toastSuccess('Reported successfully!');
        this.doReport.emit({
          success: true,
          data: resp.data
        });
      })
      .catch((err) => {
        this.appService.toastError(err);
        this.doReport.emit({
          success: false
        });
        this.reportSending = false;
      });
  }
}
