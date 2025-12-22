import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  ButtonDirective,
  ContainerComponent,
  FormControlDirective,
  FormLabelDirective,
  FormModule,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-theme',
  standalone: true,
  templateUrl: './theme.component.html',
  imports: [
    ContainerComponent,
    RowComponent,
    TableDirective,
    ButtonDirective,
    FormModule,
    FormControlDirective,
    ReactiveFormsModule,
    FormLabelDirective,
    FormsModule,
  ],
})
export class ThemeComponent {
  @Input() items: any[] = [];
  @Input() save!: (item: any) => Observable<void>;

  onSave(item: any) {
    if (this.save) {
      this.save(item).subscribe();
    }
  }
}
