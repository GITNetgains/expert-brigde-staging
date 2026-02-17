import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WebinarService } from '@services/webinar.service';
import { TutorService } from '@services/tutor.service';
import { MyCategoryService } from 'src/services/my-category.service';
import { MySubjectService } from 'src/services/my-subject.service';
import { MyTopicService } from 'src/services/my-topic.service';
import { CalendarService } from '@services/calendar.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { FileUploadComponent } from '@components/common/uploader/uploader.component';
import { ICalendarPayload, IUploaderOptions } from 'src/interfaces';
import { environment } from 'src/environments/environment';
import { CalendarComponent } from '@components/common/calendar/calendar.component';
import { imageMimeTypes, documentMimeTypes, videoMimeTypes, audioMimeTypes } from 'src/constants';
import { UtilService } from '@services/util.service';
import { EditorComponent } from 'src/components/common/editor/editor.component';
import { pick } from 'lodash-es';
import { freeSet } from '@coreui/icons';
import { IconDirective } from '@coreui/icons-angular';
import {
  FormControlDirective,
  FormLabelDirective,
  CardBodyComponent,
  CardComponent,
  FormDirective,
  RowComponent,
  ColComponent,
  FormFeedbackComponent,
  InputGroupComponent,
} from '@coreui/angular';
@Component({
  selector: 'app-update-webinar',
  standalone: true,
  templateUrl: '../form.html',
  imports: [
    FormsModule,
    IconDirective,
    ReactiveFormsModule,
    FormDirective,
    FormControlDirective,
    FormLabelDirective,
    CardComponent,
    CardBodyComponent,
    RowComponent,
    ColComponent,
    FormFeedbackComponent,
    InputGroupComponent,
    NgSelectModule,
    FileUploadComponent,
    CalendarComponent,
    EditorComponent,
  ],
})
export class UpdateWebinarComponent implements OnInit {
  public isSubmitted: boolean = false;
  public customStylesValidated = false;
  public topic: any = {
    categoryIds: [],
    subjectIds: [],
    topicIds: []
  };
  public medias: any = [];
  public mainImageUrl: string = '';
  public tutorId: any;
  icons = freeSet;

  public webinar: any = {
    name: '',
    maximumStrength: 1,
    categoryIds: [],
    isOpen: false,
    price: 0,
    mediaIds: [],
    mainImageId: '',
    description: '',
    featured: false,
    isFree: false,
    subjectIds: [],
    topicIds: [],
  };
  public calendarPayload: ICalendarPayload = {
    type: 'webinar',
    tutorId: '',
    webinarId: '',
    hashWebinar: '',
  };
  public maxFileSize: number = 15;

  constructor(
    private fb: FormBuilder,
    private webinarService: WebinarService,
    private route: ActivatedRoute,
    private router: Router,
    private tutorService: TutorService,
    private myCategoryService: MyCategoryService,
    private myTopicService: MyTopicService,
    private mySubjectService: MySubjectService,

    private calendarService: CalendarService,
    private utilService: UtilService
  ) {}
  loading = false;
  public uploadingImage: boolean = false;
  public hashWebinar: any;
  public webinarId: any;
  public myCategories: any[] = [];
  public mySubjects: any[] = [];
  public myTopics: any[] = [];
  public tutor: any = [];
  public searchTutor: any = {
    take: 100,
    name: '',
  };

  public uploadOptions: IUploaderOptions = {
    url: environment.apiUrl + '/media/photos',
    id: 'main-image-upload',
    autoUpload: false,
    allowedMimeType: imageMimeTypes,
    multiple: false,
    fileFieldName: 'file',
    uploadZone: true,
    onProgressItem: (fileItem, progress) => {},
    onProgressAll: (progress) => {},
    onCompleteItem: (item, response) => {
      try {
        const data = response?.data;
        if (data && !(response as any)?.error) {
          const mediaId = data._id || data.id;
          if (this.webinar.mainImageId) {
            const oldImageIndex = this.webinar.mediaIds.indexOf(this.webinar.mainImageId);
            if (oldImageIndex > -1) {
              this.webinar.mediaIds.splice(oldImageIndex, 1);
            }
          }

          this.webinar.mediaIds.push(mediaId);
          this.webinar.mainImageId = mediaId;
          this.mainImageUrl = data.thumbUrl || data.fileUrl || data.url || '';
        }
      } catch (e) {
        console.error('Error processing main image upload response:', e);
        this.utilService.toastError({
          title: 'Error',
          message: 'Failed to process uploaded main image'
        });
      }
    },
    hintText: 'Upload Main Image',
    maxFileSize: 1024 * 1024 * 1024,
  };
  public uploadOptionsFile: IUploaderOptions = {
    url: environment.apiUrl + '/media/files',
    id: 'main-file-upload',
    autoUpload: false,
    allowedMimeType: `${documentMimeTypes},${imageMimeTypes},${videoMimeTypes},${audioMimeTypes}`,
    multiple: false,
    fileFieldName: 'file',
    uploadZone: true,
    onProgressItem: (fileItem, progress) => {
      // console.log(`File ${fileItem.file.name} progress: ${progress}%`);
    },
    onProgressAll: (progress) => {
      // console.log(`Overall progress: ${progress}%`);
    },
    onCompleteItem: (item, response) => {
      try {
        const data = response?.data;
        if (data && !(response as any)?.error) {
          const mediaId = data._id || data.id;
          this.webinar.mediaIds.push(mediaId);

          this.medias.push({
            _id: mediaId,
            name: data.name || item?.file?.name,
            fileUrl: data.fileUrl || data.url,
            mimeType: data.mimeType
          });
        }
      } catch (e) {
        console.error('Error processing file upload response:', e);
        this.utilService.toastError({
          title: 'Error',
          message: 'Failed to process uploaded file'
        });
      }
    },
    hintText: 'Upload file',
    maxFileSize: 1024 * 1024 * 1024,
  };
  ngOnInit(): void {
    this.webinarId = this.route.snapshot.paramMap.get('id');
    this.webinarService.findOne(this.webinarId).subscribe((resp) => {
      this.medias = resp.data.media;
      this.mainImageUrl = resp.data.mainImage.fileUrl;
      // console.log(this.medias);

      this.tutorId = resp.data.tutorId;
      this.calendarPayload.tutorId = resp.data.tutorId;
      this.calendarPayload.webinarId = this.webinarId;
      this.webinar = pick(resp.data, [
        'name',
        'maximumStrength',
        'categoryIds',
        'isOpen',
        'price',
        'mediaIds',
        'mainImageId',
        'description',
        'featured',
        'tutorId',
        'tutor',
        'subjectIds',
        'topicIds',
      ]);
      this.webinar.isFree = false;
      this.queryMyCategory();
      this.setupFileUpload();
    });
  }
  setupFileUpload() {}

  submit(event: any): void {
    this.customStylesValidated = true;
    this.isSubmitted = true;
    if (!event.valid) {
      return this.utilService.toastError({
        title: 'Error',
        message: 'Please fill all required fields and select an expert.',
      });
    }
    if (!this.webinar.mainImageId) {
      return this.utilService.toastError({
        title: 'Error',
        message: 'Please upload a main image for the webinar.',
      });
    }
    if (this.webinar.price === null || this.webinar.price === undefined || this.webinar.price === '' || this.webinar.price === 0 || this.webinar.price < 0) {
      return this.utilService.toastError({
        title: 'Validation Error',
        message: 'Price is required and must be greater than 0.',
      });
    }
    this.webinar.isFree = false;
    this.calendarService.checkByWebinar(this.webinarId).subscribe((check) => {
      if (!check.data.success && this.webinar.isOpen) {
        return this.utilService.toastError({
          title: 'Validation Error',
          message:
            'Please create schedule for group session if you want the session to be public',
        });
      }

      this.webinarService
        .update(
          this.webinarId,
          pick(this.webinar, [
            'name',
            'maximumStrength',
            'categoryIds',
            'isOpen',
            'price',
            'mediaIds',
            'mainImageId',
            'description',
            'featured',
            'isFree',
            'subjectIds',
            'topicIds',
          ])
        )
        .subscribe((resp) => {
          localStorage.removeItem('hast_webinar');
          this.utilService.toastSuccess({
            title: 'Success',
            message: 'Update  Webinar Success',
          });
          this.router.navigate(['/webinar/list']);
        });
    });
  }


  removeMedia(media: any, i: any) {
    this.medias = this.medias.filter((item: any) => item._id !== media._id);
    if (this.webinar.mediaIds && this.webinar.mediaIds.includes(media._id)) {
      this.webinar.mediaIds = this.webinar.mediaIds.filter((id: any) => id !== media._id);
    }
    this.utilService.toastSuccess({ 
      title: 'Success',
      message: 'Removed media!',
    });
  }
  
  queryMyCategory() {
    this.myCategoryService
      .search({
        take: 100,
        sort: 'ordering',
        sortType: 'asc',
        isActive: true,
        tutorId: this.webinar.tutorId,
      })
      .subscribe((resp) => {
        this.myCategories = resp.data.items;
        if (this.myCategories.length > 0) {
          this.topic.categoryIds = this.myCategories.map(
            (item: any) => item.id
          );
          const categoryIds = this.topic.categoryIds || [];
          this.queryMySubject(categoryIds.join(','));
        } else {
          this.mySubjects = [];
        }
      });
  }
  onSelectMyCategories(event: any) {
    if (event && event.length > 0) {
      this.topic.categoryIds = event;
      this.topic.subjectIds = [];
      const categoryIds = this.topic.categoryIds || [];
      this.queryMySubject(categoryIds.join(','));
    } else {
      this.mySubjects = [];
      this.myTopics = [];
      this.webinar.subjectIds = [];
      this.webinar.topicIds = [];
    }
  }

  queryMySubject(myCategoryIds: string) {
    this.mySubjectService
      .search({
        categoryIds: myCategoryIds,
        take: 100,
        sort: 'ordering',
        sortType: 'asc',
        isActive: true,
        tutorId: this.webinar.tutorId,
      })
      .subscribe((resp) => {
        this.mySubjects = resp.data.items;
        if (this.mySubjects.length > 0) {
          this.mySubjects = resp.data.items;
          const mySubjectSelected = this.mySubjects.filter((item) =>
            this.webinar.subjectIds.includes(item.originalSubjectId)
          );
          this.webinar.subjectIds = mySubjectSelected.map(
            (item) => item.originalSubjectId
          );
          const subjectIds = this.webinar.subjectIds || [];
          this.queryMyTopic(subjectIds.join(','));
        } else {
          this.myTopics = [];
        }
      });
  }
  onSelectMySubjects(event: any) {
    if (event && event.length > 0) {
      this.topic.subjectIds = event.map((item: any) => item.id);
      this.topic.topicIds = [];
      const subjectIds = this.topic.subjectIds || [];
      this.queryMyTopic(subjectIds.join(','));
    } else {
      this.myTopics = [];
    }
  }
  queryMyTopic(subjectIds: string) {
    if (!subjectIds) {
      this.webinar.topicIds = [];
    } else {
      this.myTopicService
        .search({
          subjectIds: subjectIds,
          take: 100,
          sort: 'ordering',
          sortType: 'asc',
          isActive: true,
          tutorId: this.webinar.tutorId,
        })
        .subscribe((resp) => {
          this.myTopics = resp.data.items;
          const myTopicSelected = this.myTopics.filter((item) =>
            this.webinar.topicIds.includes(item.originalTopicId)
          );
          this.webinar.topicIds = myTopicSelected.map(
            (item) => item.originalTopicId
          );
        });
    }
  }
}
