import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardFooterComponent,
  CardHeaderComponent,
  ColComponent,
  ContainerComponent,
  FormCheckComponent,
  FormCheckInputDirective,
  FormCheckLabelDirective,
  FormControlDirective,
  FormDirective,
  FormLabelDirective,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { cilTrash } from '@coreui/icons';
import { IconDirective } from '@coreui/icons-angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-seo',
  standalone: true,
  templateUrl: './seo.component.html',
  imports: [
    ContainerComponent,
    RowComponent,
    ColComponent,
    TableDirective,
    FormsModule,
    ButtonDirective,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    CardFooterComponent,
    FormCheckComponent,
    FormCheckInputDirective,
    FormCheckLabelDirective,
    IconDirective,
    FormLabelDirective,
    FormDirective,
    FormControlDirective,
  ],
})
export class SeoComponent {
  @Input() items: any[] = [];
  @Input() save!: (item: any) => Observable<void>;

  icons = { cilTrash };

  initialScript: any = {
    name: 'New script',
    script: "<script>alert('Script work on body')</script>",
    isActive: false,
  };

  onSave(item: any) {
    if (this.save) {
      this.save(item).subscribe();
    }
  }

  addScript(type: string, item: any) {
    item.value[type].push({ ...this.initialScript });
  }

  deleteScript(type: string, index: any, item: any) {
    item.value[type].splice(index, 1);
  }
}
