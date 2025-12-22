import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ButtonDirective,
  ContainerComponent,
  FormLabelDirective,
  FormModule,
  FormSelectDirective,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-platform',
  standalone: true,
  templateUrl: './platform.component.html',
  imports: [
    CommonModule,
    ContainerComponent,
    RowComponent,
    TableDirective,
    FormModule,
    ButtonDirective,
    FormsModule,
    FormSelectDirective,
    FormLabelDirective,
  ],
})
export class PlatformComponent {
  @Input() items: any[] = [];
  @Input() save!: (item: any) => Observable<void>;

  onSave(item: any) {
    if (this.save) {
      this.save(item).subscribe();
    }
  }
}
