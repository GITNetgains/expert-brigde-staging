import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { LanguageService } from '@services/i18nLanguage.service';
import { AppPaginationComponent } from '@components/common';
import { freeSet } from '@coreui/icons';
import { IconDirective } from '@coreui/icons-angular';
import { LanguagesModalComponent } from '../languageModel/language.model';
import {
  BorderDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  CardFooterComponent,
  BadgeComponent,
  ColComponent,
  ContainerComponent,
  RowComponent,
  TableDirective,
  ModalModule,
} from '@coreui/angular';
import { pick } from 'lodash-es';
import { UtilService } from '@services/util.service';
@Component({
  selector: 'app-languages-listing',
  templateUrl: './languages.html',
  imports: [
    CommonModule,
    FormsModule,
    IconDirective,
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    CardFooterComponent,
    TableDirective,
    BorderDirective,
    BadgeComponent,
    AppPaginationComponent,
    ModalModule,
    LanguagesModalComponent,
    RouterLink,
  ],
})
export class LanguagesListComponent implements OnInit {
  items = [];
  public visible = false;
  public lang: any = {};
  page = 1;
  total: number = 0;
  pageSize: number = 10;
  icons = freeSet;

  loading = false;
  constructor(
    private service: LanguageService,
    private route: ActivatedRoute,
    private utilService: UtilService
  ) {
    this.route.queryParams.subscribe((params) => {
      const page = parseInt(params['page']) || 1;
      this.page = !isNaN(page) ? page : 1;
      this.query();
    });
  }
  ngOnInit(): void {}
  query() {
    this.loading = true;
    this.service
      .search({
        page: this.page,
      })
      .subscribe((resp) => {
        this.items = resp.data.items;
        this.total = resp.data.count;
      });
  }
  update(item: any, field: any, status: Boolean) {
    const update = item;
    update[field] = status;
    this.service
      .update(
        item._id,
        pick(update, ['isDefault', 'isActive', 'key', 'name', 'flag'])
      )
      .subscribe((resp) => {
        item[field] = status;
        this.query();
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'Language updated successfully',
        });
      });
  }
  openModalUpdate(event: any) {
    this.visible = true;

    this.lang = event;
  }
  openModalCreate() {
    this.visible = true;
  }

  removeLanguage(id: any, index: number) {
    if (window.confirm('Are you sure to delete this language?')) {
      this.service.remove(id).subscribe(() => {
        this.query();
      });
    }
  }
  onModalClose() {
    this.visible = false;
  }
}
