import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-make-it-happen',
  templateUrl: './make-it-happen.component.html',
  styleUrls: ['./make-it-happen.component.scss']
})
export class MakeItHappenComponent implements OnInit {

  brandsRow1: string[] = [];
  brandsRow2: string[] = [];
  private isBrowser = false;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) return;
    this.http.get<any>('assets/data/brands.json')
      .subscribe(data => {
        this.brandsRow1 = data.brandsRow1;
        this.brandsRow2 = data.brandsRow2;
      });
  }
}
