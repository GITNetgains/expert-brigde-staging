import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ButtonDirective,
  ContainerComponent,
  FormCheckComponent,
  FormCheckInputDirective,
  FormCheckLabelDirective,
  FormControlDirective,
  FormDirective,
  FormLabelDirective,
  InputGroupComponent,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-other',
  standalone: true,
  templateUrl: './other.component.html',
  imports: [
    ContainerComponent,
    RowComponent,
    TableDirective,
    InputGroupComponent,
    ButtonDirective,
    FormControlDirective,
    FormsModule,
    FormLabelDirective,
    FormDirective,
    FormCheckComponent,
    FormCheckInputDirective,
    FormCheckLabelDirective,
  ],
})
export class OtherComponent {
  @Input() items: any[] = [];
  @Input() save!: (item: any) => Observable<void>;

  onSave(item: any) {
    if (this.save) {
      this.save(item).subscribe();
    }
  }
}
