import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { jsPDF } from 'jspdf';
import domtoimage from 'dom-to-image-more';
import { IMyCourse } from 'src/app/interface';
import { AppService, SectionService } from 'src/app/services';

@Component({
  selector: 'app-certificate-form',
  templateUrl: './my-certificate.html'
})
export class MyCertificateComponent implements OnInit {
  @Input() myCourse: IMyCourse;
  @Input() userName = '';
  @Input() appConfig: any;
  public submitted = false;
  public stringDuration = '';

  public totalLength = 0;
  cerImg = '';
  loadingCer = false;
  constructor(
    private appService: AppService,
    public activeModal: NgbActiveModal,
    private sectionService: SectionService
  ) {}

  ngOnInit() {
    this.loadingCer = true;
    this.sectionService
      .search({
        courseId: this.myCourse.courseId,
        take: 100,
        sort: 'ordering',
        sortType: 'asc'
      })
      .then((resp) => {
        if (resp.data && resp.data.items) {
          resp.data.items.map((item: any) => {
            this.calDuration(item);
            this.totalLength += item.duration;
            //this.course.totalLecture += item.totalLecture;
          });
        } else this.totalLength = 0;
        this.stringDuration = this.returnDurationString(
          this.totalLength
        ) as string;

        setTimeout(() => {
          const data = document.getElementById('my_certificate');
          const options = { background: 'white' };
          domtoimage.toPng(data, options).then((contentDataURL: any) => {
            this.cerImg = contentDataURL;
            this.loadingCer = false;
          });
        }, 100);
      })
      .catch((err) => {
        this.appService.toastError(err);

        this.loadingCer = false;
      });
  }

  calDuration(section: any) {
    // let countMedia = 0;
    const lectures = section.lectures || [];
    let duration = 0;
    lectures.forEach((item: any) => {
      let lectureDuration = 0;
      item.medias.forEach((media: any) => {
        // countMedia++;
        if (media.mediaType === 'pdf') {
          duration += media.totalLength;
          lectureDuration += media.totalLength;
        } else {
          duration += media.media.duration;
          lectureDuration += media.media.duration;
        }
      });
      item.duration = lectureDuration;
    });
    section.duration = duration;
  }

  returnDurationString(seconds: number) {
    if (seconds == 0) return '0h:0m';
    else {
      // let h, m, s: number;
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds - h * 3600) / 60);
      const s = seconds - h * 3600 - m * 60;
      if (h > 0) {
        return h + 'h' + m + 'm';
      } else {
        return m + 'm' + s + 's';
      }
    }
  }

  exportAsPDF(div_id: string) {
    const data = document.getElementById(div_id) as any;
    const w = data.offsetWidth;
    const h = data.offsetHeight;
    const options = { background: 'white' };
    domtoimage.toPng(data, options).then((contentDataURL: any) => {
      const pdf = new jsPDF('l', 'px', [w, h]);
      // let pdf = new jsPDF('l', 'cm', 'a4'); //Generates PDF in landscape mode
      //let pdf = new jsPDF('p', 'cm', 'a4'); //Generates PDF in portrait mode
      pdf.addImage(contentDataURL, 'PNG', 0, 0, w, h);
      pdf.save('Certificate.pdf');
    });
  }
}
