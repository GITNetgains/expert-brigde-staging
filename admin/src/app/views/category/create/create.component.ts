import { CategoryService, UtilService } from '../../../../services';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FileUploadComponent } from '@components/common/uploader/uploader.component';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { imageMimeTypes } from 'src/constants';
import { SubjectListComponent } from '@app/views/subject/list/list.component';
import {
  FormControlDirective,
  FormLabelDirective,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  FormDirective,
  RowComponent,
  ColComponent,
  FormFeedbackComponent,
  InputGroupComponent,
  Tabs2Module,
  TabsComponent,
} from '@coreui/angular';
@Component({
  selector: 'app-create-grade',
  standalone: true,
  templateUrl: '../form.component.html',
  imports: [
    FormDirective,
    FormControlDirective,
    FormLabelDirective,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    RowComponent,
    ColComponent,
    CommonModule,
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
export class CreateCategoryComponent implements OnInit {
  constructor(
    private categoryService: CategoryService,
    private utilService: UtilService,
    private router: Router
  ) {}
  public uploadOptions: any = {};
  public mainImageUrl: string = '';

  public category: any = {
    name: '',
    alias: '',
    ordering: 0,
    imageId: '',
  };
  selectedFile: File | null = null;
  categoryId: string = '';
  public isSubmitted = false;
  public categoryForm: any = {};
  public customStylesValidated = false;

  // public toasterPlacement: ToasterPlacement;
  ngOnInit(): void {
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
  submit(form: any): void {
    this.isSubmitted = true;
    this.customStylesValidated = true;
    if (!form.valid) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Something went wrong, please check and try again!',
      });
      return;
    }

    const data = {
      name: this.category.name,
      alias: this.category.alias,
      ordering: this.category.ordering,
      imageId: this.category.imageId,
    };

    this.categoryService.create(data).subscribe((response) => {
      this.utilService.toastSuccess({
        title: 'Error',
        message: 'category created successfully',
      });
      this.router.navigate(['/category/list']);
    });
  }
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      // console.log('File selected:', this.selectedFile);
    }
  }
}
