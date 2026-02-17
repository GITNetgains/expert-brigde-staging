import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EditorComponent } from 'src/components/common/editor/editor.component';
import { TutorService } from '@services/tutor.service';
import { MyCategoryService } from 'src/services/my-category.service';
import { MySubjectService } from 'src/services/my-subject.service';
import { MyTopicService } from 'src/services/my-topic.service';
import { CalendarService } from '@services/calendar.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { FileUploadComponent } from '@components/common/uploader/uploader.component';
import { ICalendarPayload, IUploaderOptions } from 'src/interfaces';
import { environment } from 'src/environments/environment';
import { WebinarService } from '@services/webinar.service';
import { CalendarComponent } from '@components/common/calendar/calendar.component';
import { imageMimeTypes, documentMimeTypes, videoMimeTypes, audioMimeTypes } from 'src/constants';
import { UtilService } from '@services/util.service';
import { randomHash } from '@components/shared/util';
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
  selector: 'app-create-group',
  standalone: true,
  templateUrl: '../form.html',
  imports: [
    IconDirective,
    FormsModule,
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
    FormFeedbackComponent,
  ],
})
export class CreateWebinarComponent implements OnInit {
  public isSubmitted: boolean = false;
  public customStylesValidated = false;
  public topic: any = {
    categoryIds: [],
    subjectIds: [],
    topicIds: []
  };
  public mainImageUrl: string = '';
  public medias: any = [];
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
    type: '',
    tutorId: '',
    webinarId: '',
    hashWebinar: '',
  };
  icons = freeSet;

  public uploadOptions: IUploaderOptions = {
    url: environment.apiUrl + '/media/photos',
    id: 'main-image-upload',
    autoUpload: false,
    allowedMimeType: imageMimeTypes,
    multiple: false,
    fileFieldName: 'file',
    uploadZone: true,
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
      }
    },
    hintText: 'Upload main Image',
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

          if (!this.webinar.mainImageId) {
            this.webinar.mainImageId = mediaId;
          }
        }
      } catch (e) {
        console.error('Error processing file upload response:', e);
        this.utilService.toastError({
          title: 'Error',
          message: 'Failed to process uploaded file'
        });
      }
    },
    hintText: 'Upload Files',
    maxFileSize: 1024 * 1024 * 1024,
  };

  constructor(
    private router: Router,
    private webinarService: WebinarService,
    private tutorService: TutorService,
    private myCategoryService: MyCategoryService,
    private myTopicService: MyTopicService,
    private mySubjectService: MySubjectService,

    private calendarService: CalendarService,
    private utilService: UtilService
  ) {}
  loading = false;
  public hashWebinar: any;

  public myCategories: any[] = [];
  public mySubjects: any[] = [];
  public myTopics: any[] = [];
  public tutor: any = [];
  public searchTutor: any = {
    take: 100,
    name: '',
  };

  ngOnInit(): void {
    const paramsTutor = Object.assign({}, this.searchTutor);
    this.tutorService.search(paramsTutor).subscribe({
      next: (resp) => {
        this.tutor = resp.data.items;
      },
    });
    this.hashWebinar = localStorage.getItem('hast_webinar');
    this.calendarPayload.hashWebinar = this.hashWebinar;
    if (!this.hashWebinar) {
      this.hashWebinar = randomHash(32, '');
      localStorage.setItem('hast_webinar', this.hashWebinar);
    }
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
  ngOndestroy() {
    this.calendarPayload.type = 'webinar';
    if (this.hashWebinar) {
      this.calendarService.deleteByHash(this.hashWebinar);
      localStorage.removeItem('hast_webinar');
      this.calendarPayload.hashWebinar = this.hashWebinar;
    }
  }

  submit(event: any): void {
    if (this.isSubmitted) {
      return this.utilService.toastError({
        title: 'error',
        message: 'Oops! You missed a required field',
      });
    }

    this.customStylesValidated = true;
    if (!event.valid || !this.webinar.tutorId) {
      return this.utilService.toastError({
        title: 'Validation Error',
        message: 'Please fill all required fields and select an expert.',
      });
    }
    if (!this.webinar.mainImageId) {
      return this.utilService.toastError({
        title: 'Validation Error',
        message: 'Please upload a main image for the webinar.',
      });
    }
    if (this.webinar.price === null || this.webinar.price === undefined || this.webinar.price === '' || this.webinar.price === 0 || this.webinar.price < 0) {
      return this.utilService.toastError({
        title: 'Validation Error',
        message: 'Price is required and must be greater than 0.',
      });
    }
    this.isSubmitted = true;
    this.webinar.isFree = false;
    this.calendarService.checkByHash(this.hashWebinar).subscribe((check) => {
      if (!check.data.success && this.webinar.isOpen) {
        return this.utilService.toastError({
          title: 'Validation Error',
          message: 'This webinar is already open for booking.',
        });
      }
      const data = this.hashWebinar
        ? Object.assign(this.webinar, { hashWebinar: this.hashWebinar })
        : this.webinar;
      console.log(data);
      this.calendarPayload.hashWebinar = this.hashWebinar;
      this.webinarService.create(data).subscribe((resp) => {
        localStorage.removeItem('hast_webinar');
        this.utilService.toastSuccess({
          title: 'success',
          message: 'Create Success',
        });
        this.router.navigate(['/webinar/list/']);
      });
    });
  }

  selectTutor(tutorId: string) {
    // tutorId is already set via ngModel, we just need to handle the side effects
    if (!tutorId) return;
    
    this.myCategories = [];
    this.mySubjects = [];
    this.myTopics = [];
    this.calendarPayload.tutorId = tutorId;
    this.queryMyCategory();
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
          const subjectIds = this.topic.subjectIds || [];
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
      this.myTopics = [];
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
