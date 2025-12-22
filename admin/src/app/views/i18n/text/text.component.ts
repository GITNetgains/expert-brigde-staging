import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TextService } from '@services/i18nText.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppPaginationComponent } from '@components/common';
import { UtilService } from '@services/util.service';

import {
  CardBodyComponent,
  CardComponent,
  RowComponent,
  ContainerComponent,
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
@Component({
  selector: 'app-text',
  templateUrl: './text.component.html',
  imports: [
    CommonModule,
    IconDirective,
    CardComponent,
    CardBodyComponent,
    RowComponent,
    ReactiveFormsModule,
    FormsModule,
    CardBodyComponent,
    ContainerComponent,
    AppPaginationComponent,
  ],
})
export class TextComponent implements OnInit {
  public items: any = [];
  public page = 1;
  public total = 0;
  public newText = { text: '' };
  public search = { text: '' };

  constructor(
    private utilService: UtilService,
    private service: TextService,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe((params) => {
      const page = parseInt(params['page']) || 1;
      this.page = !isNaN(page) ? page : 1;
      this.query();
    });
  }
  ngOnInit(): void {}
  query(): void {
    this.service
      .search({ page: this.page, text: this.search.text })
      .subscribe((resp) => {
        this.items = resp.data.items;
        this.total = resp.data.count;
      });
  }
  remove(item: any, index: number) {
    if (window.confirm('Are you sure to delete this text?')) {
      this.service.remove(item._id).subscribe(() => {
        this.items.splice(index, 1);
        this.utilService.toastSuccess({
          title: 'success',
          message: 'remove text success',
        });
        this.query();
      });
    }
  }
  add() {
    if (!this.newText.text) {
      return;
    }
    this.service.create(this.newText).subscribe({
      next: (resp) => {
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'add text success',
        });
        this.items.push(resp.data);
        this.query();
      },
      error: (e) => {
        this.utilService.toastError({
          title: 'Error',
          message: 'text has been exist',
        });
      }
    });
  }
}
