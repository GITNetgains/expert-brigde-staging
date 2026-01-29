import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  BorderDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  ContainerComponent,
  GutterDirective,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { ContactService } from '@services/contact.service';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  templateUrl: './detail.component.html',
  imports: [
    CommonModule,
    ContainerComponent,
    RowComponent,
    ColComponent,
    ButtonDirective,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    BorderDirective,
    TableDirective,
    RouterLink,
    DatePipe
  ],
})
export class DetailComponent implements OnInit {
  item: any = {};
  private route = inject(ActivatedRoute);
  private contactService = inject(ContactService);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.contactService.findOne(id).subscribe((resp) => {
      this.item = resp.data;
    });
  }
}
