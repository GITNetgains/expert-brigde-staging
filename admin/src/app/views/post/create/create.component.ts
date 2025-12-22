import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
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
  RowComponent,
} from '@coreui/angular';
import { PostService } from '@services/post.service';
import { UtilService } from '@services/util.service';

@Component({
  selector: 'app-post-create',
  templateUrl: './create.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ColComponent,
    RowComponent,
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
export class PostCreateComponent {
  post: any = {
    title: '',
    alias: '',
    content: '',
    type: 'blog',
    meta: {
      tagline: '',
      author: '',
      imageUrl: ''
    }
  };

  submitted = false;
  customStylesValidated = false;

  private router = inject(Router);
  private postService = inject(PostService);
  private toasty = inject(UtilService);

  onImageSelected(url: string) {
    this.post.meta.imageUrl = url;
  }

  submit(form: NgForm) {
    this.customStylesValidated = true;

    if (!form.valid) {
      this.toasty.toastError({
        title: 'Error',
        message: 'Invalid form, please try again.',
      });
      return;
    }

    this.submitted = true;

    console.log("SUBMIT DATA →", this.post);

    this.postService.create(this.post).subscribe({
      next: () => {
        this.toasty.toastSuccess({
          title: 'Success',
          message: 'Post has been created',
        });
        this.router.navigate(['/posts/list']);
      },
      error: (err) => {
        this.toasty.toastError({
          title: 'Error',
          message: err.data?.message || 'Something went wrong!',
        });
      },
    });
  }
}
