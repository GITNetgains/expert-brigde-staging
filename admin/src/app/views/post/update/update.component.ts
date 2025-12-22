import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorComponent } from '@components/common/editor/editor.component';
import { ModalUploadComponent } from '@components/common/modal-upload/modal-upload.component';
import {
  CardBodyComponent,
  CardComponent,
  CardFooterComponent,
  CardHeaderComponent,
  ColComponent,
  FormControlDirective,
  FormFeedbackComponent,
  FormLabelDirective,
  FormModule,
  GutterDirective,
  RowComponent
} from '@coreui/angular';
import { PostService } from '@services/post.service';
import { UtilService } from '@services/util.service';
import { pick } from 'lodash-es';

@Component({
  selector: 'update-post',
  templateUrl: './update.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RowComponent,
    ColComponent,
    CardBodyComponent,
    CardHeaderComponent,
    CardComponent,
    CardFooterComponent,
    EditorComponent,
    ModalUploadComponent,
    GutterDirective,
    FormLabelDirective,
    FormControlDirective,
    FormFeedbackComponent,
    FormModule,
  ],
})
export class UpdateComponent implements OnInit {
  post: any = {
    title: '',
    alias: '',
    content: '',
    type: 'blog',
    meta: { tagline: '', author: '', imageUrl: '' }
  };
  submitted = false;
  customStylesValidated = false;
  private pId: string | null = null;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toasty = inject(UtilService);
  private postService = inject(PostService);

  ngOnInit(): void {
    this.pId = this.route.snapshot.paramMap.get('id');

    if (this.pId) {
      this.postService.findOne(this.pId).subscribe({
        next: (resp: any) => {
          this.post = pick(resp.data, ['title', 'alias', 'content', 'type', 'meta']);
          this.post.meta = this.post.meta || { tagline: '', author: '', imageUrl: '' };
        },
        error: () => {
          this.toasty.toastError({
            title: 'Error',
            message: 'Failed to fetch post data!',
          });
        },
      });
    }
  }

  submit(form: any): void {
    this.customStylesValidated = true;
    this.submitted = true;

    if (!form.valid) {
      this.toasty.toastError({
        title: 'Error',
        message: 'Something went wrong, please check and try again!',
      });
      return;
    }

    if (this.post.content) {
      this.post.content = this.post.content.replace(
        '<p data-f-id="pbf" style="text-align: center; font-size: 14px; margin-top: 30px; opacity: 0.65; font-family: sans-serif;">Powered by <a href="https://www.froala.com/wysiwyg-editor?pb=1" title="Froala Editor">Froala Editor</a></p>',
        ''
      );
    }

    this.postService.update(this.pId!, this.post).subscribe({
      next: () => {
        this.toasty.toastSuccess({
          title: 'Success',
          message: 'Updated successfully!',
        });
        this.router.navigate(['/posts/list']);
      },
      error: () => {
        this.toasty.toastError({
          title: 'Error',
          message: 'Something went wrong, please check and try again!',
        });
      },
    });
  }

  onImageSelected(url: string) {
    this.post.meta = this.post.meta || {};
    this.post.meta.imageUrl = url;
  }
}
