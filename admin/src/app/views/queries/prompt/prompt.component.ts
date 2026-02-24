import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ButtonDirective,
  CardComponent,
  CardBodyComponent,
  CardHeaderComponent,
  FormControlDirective,
  FormLabelDirective,
  RowComponent,
  ColComponent,
} from '@coreui/angular';
import { AiService, UtilService } from 'src/services';

@Component({
  selector: 'app-queries-prompt',
  standalone: true,
  templateUrl: './prompt.component.html',
  imports: [
    CommonModule,
    FormsModule,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    FormControlDirective,
    FormLabelDirective,
    RowComponent,
    ColComponent,
  ],
})
export class PromptComponent implements OnInit {
  systemPrompt = '';
  loading = false;
  saving = false;

  private aiService = inject(AiService);
  private utilService = inject(UtilService);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.aiService.getPrompt().subscribe({
      next: (res) => {
        this.systemPrompt = (res as any).data?.systemPrompt ?? '';
        this.loading = false;
      },
      error: () => {
        this.utilService.toastError({ message: 'Failed to load prompt' });
        this.loading = false;
      },
    });
  }

  save() {
    this.saving = true;
    this.aiService.updatePrompt(this.systemPrompt).subscribe({
      next: () => {
        this.utilService.toastSuccess({ message: 'Prompt saved. It will be used for new AI queries.' });
        this.saving = false;
      },
      error: () => {
        this.utilService.toastError({ message: 'Failed to save prompt' });
        this.saving = false;
      },
    });
  }
}
