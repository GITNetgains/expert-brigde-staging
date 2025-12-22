import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalUploadComponent } from '@components/common/modal-upload/modal-upload.component';
import {
  ButtonDirective,
  ContainerComponent,
  FormControlDirective,
  FormDirective,
  FormLabelDirective,
  InputGroupComponent,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { UtilService } from '@services/util.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-image',
  standalone: true,
  templateUrl: './image.component.html',
  imports: [
    ContainerComponent,
    RowComponent,
    TableDirective,
    FormsModule,
    ButtonDirective,
    InputGroupComponent,
    FormLabelDirective,
    FormDirective,
    FormControlDirective,
    ModalUploadComponent,
  ],
})
export class ImageComponent{
  @Input() items: any[] = [];
  @Input() save!: (item: any) => Observable<void>;

  isModalOpen = true;
  selectedFile: string = '';

  private toasty = inject(UtilService);

  onSave(item: any) {
    if (this.save) {
      this.save(item).subscribe();
    }
  }

  getSelectedFile(data: string, item: any, keyName: string) {
    this.selectedFile = data;

    if (keyName) {
      item.value[keyName] = this.selectedFile;
    } else {
      item.value = this.selectedFile;
    }

    if (item.value || item.value[keyName]) {
      this.toasty.toastSuccess({
        title: 'Success',
        message: 'Selected Success',
      });
    } else {
      this.toasty.toastError({
        title: 'Error',
        message: 'Some thing went wrong',
      });
    }
  }

  openModal() {
    this.isModalOpen = true;
  }
}
