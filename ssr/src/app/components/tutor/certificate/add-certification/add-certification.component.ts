import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { ITutorCertificate } from 'src/app/interface';
import { AppService, TutorService } from 'src/app/services';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-certification',
  templateUrl: './add-certification.html'
})
export class AddCetificationComponent implements OnInit {
  @Input() certificate: ITutorCertificate;
  @Input() type: string;
  @Input() tutorId: string;
  public maxFileSize: number;
  public submitted = false;
  public options: Object = {
    placeholderText: 'Enter description',
    charCounterCount: false,
    imageUpload: false
  };
  public mediaOptions: Object;

  constructor(
    private appService: AppService,
    public activeModal: NgbActiveModal,
    private tutorService: TutorService
  ) {
    this.maxFileSize = environment.maximumFileSize;
  }

  ngOnInit() {
    this.mediaOptions = {
      url: environment.apiBaseUrl + '/media/files',
      fileFieldName: 'file',
      onFinish: (resp: any) => {
        this.certificate.documentId = resp.data._id;
        this.certificate.document = resp.data;
      }
    };
    if (!this.certificate) {
      this.certificate = {
        title: '',
        description: '',
        fromYear: 1900,
        toYear: 1900,
        verified: false,
        documentId: '',
        ordering: 0,
        tutorId: '',
        type: '',
        document: null
      };
    }
  }

  submit(frm: any) {
    this.submitted = true;
    if (!frm.valid) {
      return this.appService.toastError('Please complete the required fields!');
    }
    if (!this.certificate.documentId) {
      return this.appService.toastError('Please upload document!');
    }
    if (this.certificate.toYear < this.certificate.fromYear) {
      return this.appService.toastError(
        'To year must be greater than from year!'
      );
    }
    if (this.certificate.toYear < 1900 || this.certificate.fromYear < 1900) {
      return this.appService.toastError(
        'From year and to year must be greater than or equal to 1900!'
      );
    }
    if (this.certificate.ordering < 0) {
      return this.appService.toastError(
        'Ordering must be greater than or equal to 0!'
      );
    }
    this.certificate.tutorId = this.tutorId;
    this.certificate.type = this.type;
    const data = _.pick(this.certificate, [
      'title',
      'description',
      'fromYear',
      'toYear',
      'type',
      'documentId',
      'tutorId',
      'verified',
      'ordering'
    ]);
    if (this.certificate._id) {
      return this.tutorService
        .updateCertificate(this.certificate._id, data)
        .then((resp) => {
          this.activeModal.close(resp.data);
          this.submitted = false;
          this.appService.toastSuccess(`Updated ${data.type} successfully`);
        })
        .catch((e: any) => {
          this.appService.toastError(e);
        });
    }
    return this.tutorService
      .createCertificate(data)
      .then((resp) => {
        this.activeModal.close(resp.data);
        this.submitted = false;
        this.appService.toastSuccess(`Created ${data.type} successfully!`);
      })
      .catch((e) => {
        this.appService.toastError(e);
      });
  }
}
