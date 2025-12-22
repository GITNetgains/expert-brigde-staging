import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ButtonDirective,
  ContainerComponent,
  FormModule,
  InputGroupComponent,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-stripe',
  standalone: true,
  templateUrl: './stripe.component.html',
  imports: [
    ContainerComponent,
    RowComponent,
    TableDirective,
    InputGroupComponent,
    ButtonDirective,
    FormModule,
    FormsModule,
  ],
})
export class StripeComponent {
  @Input() items: any[] = [];
  @Input() save!: (item: any) => Observable<void>;

  onSave(item: any) {
    if (this.save) {
      this.save(item).subscribe();
    }
  }
}
