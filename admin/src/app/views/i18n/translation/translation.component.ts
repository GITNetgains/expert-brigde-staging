import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UtilService } from '@services/util.service';
import { TranslationService } from '@services/i18ntranslation';
import { AppPaginationComponent } from '@components/common';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  CardBodyComponent,
  CardHeaderComponent,
  CardComponent,
  RowComponent,
  ContainerComponent,
} from '@coreui/angular';

@Component({
  templateUrl: './translation.html',
  imports: [
    AppPaginationComponent,
    CommonModule,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    RowComponent,
    ReactiveFormsModule,
    FormsModule,
    CardBodyComponent,
    ContainerComponent,
  ],
})
export class TranslationComponent implements OnInit {
  public items = [];
  public page = 1;
  public total = 0;
  public pageSize = 10;
  public search: any = {
    text: '',
    translation: '',
  };
  private lang = '';
  loading = false;
  constructor(
    private route: ActivatedRoute,
    private service: TranslationService,
    private utilService: UtilService,
    private router: Router
  ) {
    this.route.queryParams.subscribe((params) => {
      this.lang = this.route.snapshot.params['lang'];
      const page = parseInt(params['page']) || 1;
      this.page = !isNaN(page) ? page : 1;
      this.query();
    });
  }
  ngOnInit(): void {}
  query() {
    this.loading = true;
    this.service
      .search(Object.assign(this.search, { page: this.page, lang: this.lang }))
      .subscribe((resp) => {
        this.items = (resp.data && resp.data.items && resp.data.items) || [];
        this.total = (resp.data && resp.data.count && resp.data.count) || 0;
        this.loading = false;
      });
  }
  update(item: any) {
    if (!item.translation) {
      return;
    }
    this.service
      .update(item._id, { translation: item.translation })
      .subscribe((resp) => {
        this.utilService.toastSuccess({
           title: 'Success',
        message: 'Language Update Success',
        })
      });
  }
  pull() {
    this.service.pull(this.lang).subscribe(() => window.location.reload());
  }
}
