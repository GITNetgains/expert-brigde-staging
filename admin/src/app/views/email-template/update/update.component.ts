import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorComponent } from '@components/common/editor/editor.component';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  FormControlDirective,
  FormLabelDirective,
  RowComponent,
} from '@coreui/angular';
import { TemplateService } from '@services/template.service';
import { UtilService } from '@services/util.service';
import { pick } from 'lodash-es';

@Component({
  selector: 'app-update',
  standalone: true,
  templateUrl: './update.component.html',
  imports: [
    RowComponent,
    ColComponent,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    FormControlDirective,
    FormsModule,
    FormLabelDirective,
    ButtonDirective,
    EditorComponent,
  ],
})
export class UpdateComponent implements OnInit {
  template: any = {};
  isSubmitted: Boolean = false;
  templateId: any;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toasty = inject(UtilService);
  private templateService = inject(TemplateService);

  ngOnInit(): void {
    this.templateId = this.route.snapshot.paramMap.get('id') || '';

    this.templateService.findOne(this.templateId).subscribe({
      next: (resp) => {
        this.template = pick(resp.data, ['subject', 'content']);
      },
      error: (err) => {
        this.toasty.toastError({
          title: 'Error',
          message: 'Failed to fetch template',
        });
      },
    });
  }

  submit(frm: any) {
    if (!frm.valid) {
      return this.toasty.toastError({
        title: 'Error',
        message: 'Invalid form, please try again.',
      });
    }

    this.isSubmitted = true;

    this.templateService.update(this.templateId, this.template).subscribe({
      next: (resp) => {
        this.toasty.toastSuccess({
          title: 'Success',
          message: 'Updated successfully!',
        });
        this.router.navigate(['/templates/list']);
      },
      error: (err) => {
        const message =
          err?.error?.data?.message ||
          err?.error?.data?.email ||
          'Update failed';
        this.toasty.toastError({
          title: 'Error',
          message: message,
        });
        this.isSubmitted = false;
      },
    });
  }
}
