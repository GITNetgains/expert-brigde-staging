import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UtilService, CategoryService } from '../../../../services';
import { FileUploadComponent } from '@components/common/uploader/uploader.component';
import { environment } from 'src/environments/environment';
import { imageMimeTypes } from 'src/constants';
import { SubjectListComponent } from '@app/views/subject/list/list.component';
import {
  FormControlDirective,
  FormLabelDirective,
  ButtonDirective,
  CardBodyComponent,
  CardHeaderComponent,
  CardComponent,
  FormDirective,
  RowComponent,
  ColComponent,
  FormFeedbackComponent,
  InputGroupComponent,
  Tabs2Module,
  TabsComponent,
} from '@coreui/angular';

@Component({
  selector: 'app-update-grade',
  templateUrl: '../form.component.html',

  imports: [
    CommonModule,
    FormDirective,
    FormControlDirective,
    FormLabelDirective,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    RowComponent,
    ColComponent,
    ReactiveFormsModule,
    FormsModule,
    FormFeedbackComponent,
    InputGroupComponent,
    FileUploadComponent,
    Tabs2Module,
    TabsComponent,
    SubjectListComponent,
  ],
})
export class UpdateCategoryComponent implements OnInit {
  categoryId: string = '';
  category: any = {};
  selectedFile: File | null = null;
  isSubmitted = false;
  public customStylesValidated = false;
  public uploadOptions: any = {};
  public mainImageUrl: string = '';
  constructor(
    private categoryService: CategoryService,
    private router: Router,
    private utilService: UtilService
  ) {}

  ngOnInit(): void {
    this.categoryId = this.router.url.split('/').pop() || '';
    if (this.categoryId) {
      this.loadCategory();
    } else {
      this.router.navigate(['/categories/list']);
    }
    this.uploadOptions = {
      url: environment.apiUrl + '/media/photos',
      id: 'main-image-upload',
      autoUpload: false,
      allowedMimeType: imageMimeTypes,
      multiple: false,
      fileFieldName: 'file',
      uploadZone: true,
      onProgressItem: (fileItem: any, progress: number) => {
        console.log(`File ${fileItem.file.name} progress: ${progress}%`);
      },
      onProgressAll: (progress: number) => {
        console.log(`Overall progress: ${progress}%`);
      },
      onCompleteItem: (item: any, response: any) => {
        console.log(
          `File ${item.file.name} uploaded successfully`,
          response.data
        );
        this.category.imageId = response.data._id;
        if (!this.category.imageId) {
          this.category.imageId = response.data._id;
        }
      },
      hintText: 'Upload media file',
      maxFileSize: 200 * 1024 * 1024,
    };
  }

  loadCategory(): void {
    this.categoryService.findOne(this.categoryId).subscribe({
      next: (res) => {
        // console.log(this.categoryId);

        this.category = res.data;
        this.mainImageUrl = res.data.image
          ? res.data.image.thumbUrl
          : '/assets/images/icon/income.png';

        const { name, alias, ordering, description, image } = this.category;
        this.category = {
          name,
          alias,
          ordering,
          imageId: image?.id || '',
        };
      },
      error: (err) => {},
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      // this.categoryService.uploadImage(formData).subscribe({
      //   next: (res) => {
      //     this.category.imageId = res.data._id;
      //   },
      //   error: (err) => {
      //     console.error('Upload failed:', err);
      //     this.utilService.toastError({
      //       title: 'Upload Error',
      //       message: 'Could not upload image',
      //     });
      //   },
      // });
    }
  }

  submit(form: any): void {
    this.isSubmitted = true;
    this.customStylesValidated = true;
    if (form.invalid) {
      this.utilService.toastError({
        title: 'Invalid form',
        message: 'Please complete the required fields.',
      });
      return;
    }

    // Clean up unwanted fields if any
    const allowedFields = ['name', 'alias', 'ordering', 'imageId'];
    const category = Object.fromEntries(
      Object.entries(this.category).filter(([key]) =>
        allowedFields.includes(key)
      )
    );

    this.categoryService.update(this.categoryId, category).subscribe({
      next: () => {
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'Category updated successfully.',
        });
        this.router.navigate(['/category/list']);
      },
      error: (err) => {
        console.error('Update failed:', err);
        this.utilService.toastError({
          title: 'Update Error',
          message: 'Could not update category',
        });
      },
    });
  }
}
