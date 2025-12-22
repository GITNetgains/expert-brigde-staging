import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { FileUploadComponent } from '@components/common/uploader/uploader.component';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardFooterComponent,
  CardHeaderComponent,
  ColComponent,
  FormControlDirective,
  FormLabelDirective,
  FormSelectDirective,
  GutterDirective,
  RowComponent,
} from '@coreui/angular';
import { TestimonialService } from '@services/testimonial.service';
import { UtilService } from '@services/util.service';
import { imageMimeTypes } from 'src/constants';
import { environment } from 'src/environments/environment';
import { IUploaderOptions } from 'src/interfaces';

@Component({
  selector: 'app-create',
  standalone: true,
  templateUrl: './create.component.html',
  imports: [
    CommonModule,
    FormsModule,
    RowComponent,
    ColComponent,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    CardFooterComponent,
    GutterDirective,
    FormControlDirective,
    FormLabelDirective,
    FormSelectDirective,
    ButtonDirective,
    FileUploadComponent,
  ],
})
export class CreateComponent implements OnInit {
  maxSize: number = 1024;
  testimonial: any = {
    name: '',
    title: '',
    idYoutube: '',
    description: '',
    type: 'parent',
    imageId: null,
  };
  isSubmitted: boolean = false;
  imageUrl: string = '';
  mainImageOptions: any;
  imageSelected: any[] = [];

  private router = inject(Router);
  private toasty = inject(UtilService);
  private testimonialService = inject(TestimonialService);

  ngOnInit(): void {
    this.mainImageOptions = {
      onFinish: (resp: any) => {
        this.testimonial.imageId = resp.data.id;
        this.imageUrl = resp.data.fileUrl;
      },
      onFileSelect: (resp: any) => (this.imageSelected = resp),
      accept: 'image/*',
    };
  }

  uploadOptions: IUploaderOptions = {
    url: environment.apiUrl + '/media/photos',
    autoUpload: false,
    multiple: false,
    fileFieldName: 'file',
    onCompleteItem: (item, response) => {
      try {
        if (response && response.data) {
          this.testimonial.imageId = response.data.id;
          this.imageUrl = response.data.fileUrl || response.data.url || response.data.thumbUrl;
        }
      } catch (e) {
        console.error('Error processing testimonial image upload response:', e);
        this.toasty.toastError({
          title: 'Error',
          message: 'Failed to process uploaded image',
        });
      }
    },
    allowedMimeType: imageMimeTypes,
    hintText: 'Drop or click to select file',
    maxFileSize: 200 * 1024 * 1024,
    uploadZone: true,
  };

  submit(form: NgForm) {
    this.isSubmitted = true;
    if (form.invalid) {
      this.toasty.toastError({
        title: 'Error',
        message: 'Invalid form, please try again.',
      });
      return;
    }

    this.testimonialService.create(this.testimonial).subscribe({
      next: () => {
        this.toasty.toastSuccess({
          title: 'Success',
          message: 'Testimonial has been created',
        });
        this.router.navigate(['/testimonials/list']);
      },
      error: (err) => {
        this.toasty.toastError({
          title: 'Error',
          message: err?.error?.message || 'Something went wrong!',
        });
      },
    });
  }
}
