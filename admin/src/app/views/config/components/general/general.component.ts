import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalUploadComponent } from '@components/common/modal-upload/modal-upload.component';
import {
  ButtonDirective,
  ContainerComponent,
  FormControlDirective,
  InputGroupComponent,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { UtilService } from '@services/util.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  standalone: true,
  imports: [
    ContainerComponent,
    RowComponent,
    TableDirective,
    InputGroupComponent,
    ButtonDirective,
    FormControlDirective,
    FormsModule,
    ModalUploadComponent,
  ],
})
export class GeneralComponent {
  @Input() items: any[] = [];
  @Input() save!: (item: any) => Observable<void>;

  isModalOpen = true;
  selectedFile: string = '';

  private toasty = inject(UtilService);

  getSelectedFile(data: string, item: any) {
    this.selectedFile = data;
    item.value = this.selectedFile;

    if (item.value) {
      this.toasty.toastSuccess({
        title: 'Success',
        message: 'Selected successfully. Please save your changes.',
      });
    } else {
      this.toasty.toastError({
        title: 'Error',
        message: 'Please select a photo',
      });
    }
  }

  openModal() {
    this.isModalOpen = true;
  }

  onSave(item: any) {
    if (this.save) {
      this.save(item).subscribe();
    }
  }
}
