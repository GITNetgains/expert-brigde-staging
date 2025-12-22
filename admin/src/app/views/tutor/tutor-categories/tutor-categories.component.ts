import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { Subject } from 'rxjs';
import { cilPencil, cilPlus } from '@coreui/icons';
import { CommonModule } from '@angular/common';
import { IconModule } from '@coreui/icons-angular';
import {
  BadgeModule,
  ButtonModule,
  CardModule,
  GridModule,
} from '@coreui/angular';
import { UtilService } from 'src/services';
import { CategoryService } from 'src/services/category.service';
import { SubjectService } from 'src/services/subject.service';
import { TopicService } from 'src/services/topic.service';
import { MyCategoryService } from 'src/services/my-category.service';
import { MySubjectService } from 'src/services/my-subject.service';
import { MyTopicService } from 'src/services/my-topic.service';
import { MyCategoryFormComponent } from '../modal-create-category/modal';
import { MySubjectFormComponent } from '../modal-mysubject/my-subject';
import { MyTopicFormComponent } from '../modal-create-topic/modal';

@Component({
  selector: 'app-tutor-categories',
  templateUrl: './tutor-categories.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IconModule,
    ButtonModule,
    BadgeModule,
    CardModule,
    GridModule,
    MyCategoryFormComponent,
    MySubjectFormComponent,
    MyTopicFormComponent,
  ],
})
export class TutorCategoriesComponent implements OnInit, OnChanges, OnDestroy {
  @Input() tutorId: string = '';
  @Output() categorySelected = new EventEmitter<any>();
  @Output() subjectSelected = new EventEmitter<any>();
  @Output() topicSelected = new EventEmitter<any>();
  icons = { cilPencil, cilPlus };

  myCategories: any[] = [];
  filterMyCategory: any = {
    loading: false,
    currentPage: 1,
    pageSize: 10,
    total: 0,
    sortOption: {
      sortBy: 'createdAt',
      sortType: 'desc',
    },
  };

  mySubjects: any[] = [];
  filterMySubject: any = {
    loading: false,
    currentPage: 1,
    pageSize: 10,
    total: 0,
    myCategoryId: '',
    sortOption: {
      sortBy: 'createdAt',
      sortType: 'desc',
    },
  };

  myTopics: any[] = [];
  filterMyTopic: any = {
    loading: false,
    currentPage: 1,
    pageSize: 10,
    total: 0,
    mySubjectId: '',
    sortOption: {
      sortBy: 'createdAt',
      sortType: 'desc',
    },
  };

  selectedCategory: any = null;
  selectedSubject: any = null;

  categoryModalVisible: boolean = false;
  subjectModalVisible: boolean = false;
  topicModalVisible: boolean = false;
  currentCategory: any = null;
  currentSubject: any = null;
  currentTopic: any = null;

  categories: any[] = [];
  subjects: any[] = [];
  topics: any[] = [];

  private destroy$ = new Subject<void>();

  private utilService = inject(UtilService);
  private categoryService = inject(CategoryService);
  private subjectService = inject(SubjectService);
  private topicService = inject(TopicService);
  private myCategoryService = inject(MyCategoryService);
  private mySubjectService = inject(MySubjectService);
  private myTopicService = inject(MyTopicService);

  constructor() {}

  ngOnInit(): void {
    if (this.tutorId) {
      this.loadCategories();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tutorId'] && changes['tutorId'].currentValue) {
      this.loadCategories();
      this.queryMyCategories();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories() {
    this.categoryService.search({ take: 1000, isActive: true }).subscribe({
      next: (resp: any) => {
        if (resp.data?.items) {
          this.categories = resp.data.items;
        }
      },
    });
  }

  loadSubjects(categoryId: string) {
    this.subjectService
      .search({
        categoryIds: categoryId,
        take: 1000,
        isActive: true,
      })
      .subscribe({
        next: (resp: any) => {
          if (resp.data?.items) {
            this.subjects = resp.data.items;
          }
        },
      });
  }
  loadTopics(subjectId: string) {
    this.topicService
      .search({
        subjectIds: subjectId,
        take: 1000,
        isActive: true,
      })
      .subscribe({
        next: (resp: any) => {
          if (resp.data?.items) {
            this.topics = resp.data.items;
          }
        },
      });
  }

  queryMyCategories() {
    this.filterMyCategory.loading = true;
    const params = {
      page: this.filterMyCategory.currentPage,
      take: this.filterMyCategory.pageSize,
      sort: this.filterMyCategory.sortOption.sortBy,
      sortType: this.filterMyCategory.sortOption.sortType,
      tutorId: this.tutorId,
    };

    this.myCategoryService.search(params).subscribe({
      next: (resp: any) => {
        if (resp.data?.items) {
          this.filterMyCategory.total = resp.data.count;
          this.myCategories = resp.data.items;
        }
        this.filterMyCategory.loading = false;
      },
      error: (err: any) => {
        this.filterMyCategory.loading = false;
        this.utilService.toastError({
          title: 'Error',
          message:
            err.error?.message || 'Something went wrong, please try again!',
        });
      },
    });
  }

  selectMyCategory(category: any) {
    this.selectedCategory = category;
    this.selectedSubject = null;
    this.filterMySubject.myCategoryId = category._id;
    this.mySubjects = [];
    this.myTopics = [];
    this.categorySelected.emit(category);
    this.queryMySubjects();

    if (category.originalCategoryId) {
      this.loadSubjects(category.originalCategoryId);
    }
  }

  queryMySubjects() {
    this.filterMySubject.loading = true;
    const params = {
      page: this.filterMySubject.currentPage,
      take: this.filterMySubject.pageSize,
      sort: this.filterMySubject.sortOption.sortBy,
      sortType: this.filterMySubject.sortOption.sortType,
      myCategoryId: this.filterMySubject.myCategoryId,
      tutorId: this.tutorId,
    };

    this.mySubjectService.search(params).subscribe({
      next: (resp: any) => {
        if (resp.data?.items) {
          this.filterMySubject.total = resp.data.count;
          this.mySubjects = resp.data.items;
        }
        this.filterMySubject.loading = false;
      },
      error: (err: any) => {
        this.filterMySubject.loading = false;
        this.utilService.toastError({
          title: 'Error',
          message:
            err.error?.message || 'Something went wrong, please try again!',
        });
      },
    });
  }

  selectMySubject(subject: any) {
    this.selectedSubject = subject;
    this.filterMyTopic.mySubjectId = subject._id;
    this.myTopics = [];
    this.subjectSelected.emit(subject);
    this.queryMyTopics();

    if (subject.originalSubjectId) {
      this.loadTopics(subject.originalSubjectId);
    }
  }

  queryMyTopics() {
    this.filterMyTopic.loading = true;
    const params = {
      page: this.filterMyTopic.currentPage,
      take: this.filterMyTopic.pageSize,
      sort: this.filterMyTopic.sortOption.sortBy,
      sortType: this.filterMyTopic.sortOption.sortType,
      mySubjectId: this.filterMyTopic.mySubjectId,
      myCategoryId: this.selectedCategory?._id,
      tutorId: this.tutorId,
    };

    this.myTopicService.search(params).subscribe({
      next: (resp: any) => {
        if (resp.data?.items) {
          this.filterMyTopic.total = resp.data.count;
          this.myTopics = resp.data.items;
        }
        this.filterMyTopic.loading = false;
      },
      error: (err: any) => {
        this.filterMyTopic.loading = false;
        this.utilService.toastError({
          title: 'Error',
          message:
            err.error?.message || 'Something went wrong, please try again!',
        });
      },
    });
  }

  pageChange(type: string, page?: number) {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (page) {
      if (type === 'category') {
        this.filterMyCategory.currentPage = page;
        this.queryMyCategories();
      } else if (type === 'subject') {
        this.filterMySubject.currentPage = page;
        this.queryMySubjects();
      } else if (type === 'topic') {
        this.filterMyTopic.currentPage = page;
        this.queryMyTopics();
      }
    }
  }

  submitCategory(myCategory: any = { isActive: true }) {
    this.currentCategory = myCategory._id
      ? { ...myCategory }
      : { isActive: true, originalCategoryId: null };
    this.categoryModalVisible = true;
  }

  onCategoryModalClosed(result: any) {
    if (!result) {
      this.categoryModalVisible = false;
      return;
    }

    if (this.currentCategory?._id) {
      this.myCategoryService
        .update(this.currentCategory._id, { ...result, tutorId: this.tutorId })
        .subscribe({
          next: (resp: any) => {
            if (resp.data) {
              this.utilService.toastSuccess({
                title: 'Success',
                message: 'Updated successfully!',
              });
              this.queryMyCategories();
            }
          },
          error: (err: any) => {
            this.utilService.toastError({
              title: 'Error',
              message:
                err.error?.data?.message || 'Something went wrong, please try again!',
            });
          },
        });
    } else {
      this.myCategoryService
        .create({ ...result, tutorId: this.tutorId })
        .subscribe({
          next: (resp: any) => {
            if (resp.data) {
              this.myCategories.push(resp.data);
              this.utilService.toastSuccess({
                title: 'Success',
                message: 'Created successfully!',
              });
              this.queryMyCategories();
            }
          },
          error: (err: any) => {
            this.utilService.toastError({
              title: 'Error',
              message:
                err.error?.data?.message || 'Something went wrong, please try again!',
            });
          },
        });
    }

    this.categoryModalVisible = false;
  }

  submitSubject(mySubject: any = { isActive: true }) {
    if (!this.selectedCategory) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Please select a category first!',
      });
      return;
    }

    this.currentSubject = mySubject._id
      ? { ...mySubject }
      : { isActive: true, originalSubjectId: null };
    this.subjectModalVisible = true;
  }

  onSubjectModalClosed(result: any) {
    if (!result) {
      this.subjectModalVisible = false;
      return;
    }

    if (this.currentSubject?._id) {
      this.mySubjectService
        .update(this.currentSubject._id, {
          ...result,
          myCategoryId: this.selectedCategory?._id,
          tutorId: this.tutorId,
        })
        .subscribe({
          next: (resp: any) => {
            if (resp.data) {
              this.utilService.toastSuccess({
                title: 'Success',
                message: 'Updated successfully!',
              });
              this.queryMySubjects();
            }
          },
          error: (err: any) => {
            this.utilService.toastError({
              title: 'Error',
              message:
                err.error?.data?.message || 'Something went wrong, please try again!',
            });
          },
        });
    } else {
      this.mySubjectService
        .create({
          ...result,
          myCategoryId: this.selectedCategory?._id,
          tutorId: this.tutorId,
        })
        .subscribe({
          next: (resp: any) => {
            if (resp.data) {
              this.mySubjects.push(resp.data);
              this.utilService.toastSuccess({
                title: 'Success',
                message: 'Created successfully!',
              });
              this.queryMySubjects();
            }
          },
          error: (err: any) => {
            this.utilService.toastError({
              title: 'Error',
              message:
                err.error?.data?.message || 'Something went wrong, please try again!',
            });
          },
        });
    }

    this.subjectModalVisible = false;
  }

  submitTopic(myTopic: any = { isActive: true, price: 0 }) {
    if (!this.selectedSubject) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Please select a subject first!',
      });
      return;
    }

    this.currentTopic = myTopic._id
      ? { ...myTopic }
      : { isActive: true, price: 0, originalTopicId: null };
    this.topicModalVisible = true;
  }

  onTopicModalClosed(result: any) {
    if (!result) {
      this.topicModalVisible = false;
      return;
    }

    if (this.currentTopic?._id) {
      this.myTopicService
        .update(this.currentTopic._id, {
          ...result,
          myCategoryId: this.selectedCategory?._id,
          mySubjectId: this.selectedSubject?._id,
          tutorId: this.tutorId,
        })
        .subscribe({
          next: (resp: any) => {
            if (resp.data) {
              this.utilService.toastSuccess({
                title: 'Success',
                message: 'Updated successfully!',
              });
              this.queryMyTopics();
            }
          },
          error: (err: any) => {
            this.utilService.toastError({
              title: 'Error',
              message:
                err.error?.data?.message || 'Something went wrong, please try again!',
            });
          },
        });
    } else {
      this.myTopicService
        .create({
          ...result,
          myCategoryId: this.selectedCategory?._id,
          mySubjectId: this.selectedSubject?._id,
          tutorId: this.tutorId,
        })
        .subscribe({
          next: (resp: any) => {
            if (resp.data) {
              this.myTopics.push(resp.data);
              this.utilService.toastSuccess({
                title: 'Success',
                message: 'Created successfully!',
              });
              this.queryMyTopics();
            }
          },
          error: (err: any) => {
            this.utilService.toastError({
              title: 'Error',
              message:
                err.error?.data?.message || 'Something went wrong, please try again!',
            });
          },
        });
    }

    this.topicModalVisible = false;
  }

  bindCategoryCallback() {
    return (result: any) => this.onCategoryModalClosed(result);
  }

  bindSubjectCallback() {
    return (result: any) => this.onSubjectModalClosed(result);
  }

  bindTopicCallback() {
    return (result: any) => this.onTopicModalClosed(result);
  }
}
