import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { pick } from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-section-form',
  templateUrl: './section-form.html'
})
export class SectionFormComponent implements OnInit {
  @Input() section = {} as any;
  public submitted = false;
  public videoOptions: any;
  public uploading = false;
  public videoSelected: any[] = [];
  public videoUrl = '';
  constructor(
    private toasty: ToastrService,
    public activeModal: NgbActiveModal,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.videoUrl = this.section.trialVideo ? this.section.trialVideo.fileUrl : null;
    this.videoOptions = {
      url: environment.apiBaseUrl + '/media/videos',
      fileFieldName: 'file',
      onFinish: (resp: any) => {
        this.uploading = false;
        this.section.trialVideoId = resp.data._id;
        this.videoUrl = resp.data.fileUrl;
      },
      id: 'section-video-trial',
      accept: 'video/*',
      onUploading: () => (this.uploading = true),
      onFileSelect: (resp: any) => (this.videoSelected = resp)
    };
  }

  submit(frm: any) {
    this.submitted = true;
    if (!frm.valid || this.section.ordering < 0) {
      return this.toasty.error(this.translate.instant('Please complete the required fields!'));
    }
    this.activeModal.close(pick(this.section, ['title', 'description', 'ordering', 'trialVideoId']));
  }
}
