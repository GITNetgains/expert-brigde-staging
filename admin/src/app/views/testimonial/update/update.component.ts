import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  selector: 'app-update',
  standalone: true,
  templateUrl: './update.component.html',
  imports: [
    RowComponent,
    ColComponent,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    CardFooterComponent,
    FormsModule,
    ButtonDirective,
    FormControlDirective,
    FormLabelDirective,
    GutterDirective,
    FormSelectDirective,
    FileUploadComponent,
  ],
})
export class UpdateComponent implements OnInit {
  maxSize: number = 1024;
  testimonial: any = {};
  isSubmitted: boolean = false;
  imageUrl: string = '';
  mainImageOptions: any;
  imageSelected: any[] = [];

  private testimonialId: string = '';

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toasty = inject(UtilService);
  private testimonialService = inject(TestimonialService);

  ngOnInit(): void {
    this.testimonialId = this.route.snapshot.paramMap.get('id') ?? '';

    this.mainImageOptions = {
      onFinish: (resp: any) => {
        this.testimonial.imageId = resp.data._id;
        this.imageUrl = resp.data.fileUrl;
      },
      onFileSelect: (resp: any) => (this.imageSelected = resp),
      accept: 'image/*',
    };

    this.testimonialService.findOne(this.testimonialId).subscribe({
      next: (resp) => {
        this.testimonial = {
          name: resp.data.name,
          title: resp.data.title,
          description: resp.data.description,
          idYoutube: resp.data.idYoutube,
          type: resp.data.type,
          imageId: resp.data.imageId,
        };
        this.imageUrl = resp.data.image?.fileUrl;
      },
      error: () => {
        this.toasty.toastError({
          title: 'Error',
          message: 'Failed to load testimonial',
        });
      },
    });
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

  submit(form: any): void {
    this.isSubmitted = true;

    if (!form.valid) {
      return this.toasty.toastError({
        title: 'Error',
        message: 'Invalid form, please try again.',
      });
    }

    this.testimonialService
      .update(this.testimonialId, this.testimonial)
      .subscribe({
        next: () => {
          this.toasty.toastSuccess({
            title: 'Success',
            message: 'Updated successfully!',
          });
          this.router.navigate(['/testimonials/list']);
        },
        error: (err) => {
          this.toasty.toastError({
            title: 'Error',
            message:
              err?.error?.data?.message ||
              err?.error?.data?.email ||
              'Something went wrong!',
          });
        },
      });
  }
}
