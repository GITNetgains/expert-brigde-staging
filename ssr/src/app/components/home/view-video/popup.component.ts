import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
@Component({
  selector: 'app-popup-view-video',
  templateUrl: './popup.html'
})
export class ViewYoutubeModalComponent implements OnInit {
  @Input() idYoutube: string;
  urlYoutube = null as any;
  constructor(public activeModal: NgbActiveModal, private toasty: ToastrService, private route: ActivatedRoute, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.urlYoutube = this.setUrl(this.idYoutube);
  }

  setUrl(idYoutube: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${idYoutube}`);
  }
}
