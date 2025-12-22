import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  ButtonCloseDirective,
  ButtonDirective,
  ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
} from '@coreui/angular';
import { cilTrash } from '@coreui/icons';
import { IconModule } from '@coreui/icons-angular';

@Component({
  selector: 'app-modal-delete',
  standalone: true,
  templateUrl: './modal-delete.component.html',
  imports: [
    ButtonDirective,
    ModalComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ButtonCloseDirective,
    ModalBodyComponent,
    ModalFooterComponent,
    IconModule,
  ],
})
export class ModalDeleteComponent {
  @Input() item: any;
  @Output() confirmDelete = new EventEmitter<any>();

  visible = false;
  icons = { cilTrash };

  openModal() {
    this.visible = true;
  }

  closeModal() {
    this.visible = false;
  }

  handleLiveDemoChange(event: any) {
    this.visible = event;
  }

  confirm() {
    this.confirmDelete.emit(this.item);
    this.closeModal();
  }
}
