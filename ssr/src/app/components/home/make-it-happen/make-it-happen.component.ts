import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-make-it-happen',
  templateUrl: './make-it-happen.component.html',
  styleUrls: ['./make-it-happen.component.scss']
})
export class MakeItHappenComponent implements OnInit {

  brandsRow1: string[] = [];
  brandsRow2: string[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any>('assets/data/brands.json')
      .subscribe(data => {
        this.brandsRow1 = data.brandsRow1;
        this.brandsRow2 = data.brandsRow2;
      });
  }
}
