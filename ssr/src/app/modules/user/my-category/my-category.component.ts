import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MyCategoryFormComponent } from './modal-create-category/modal';
import { MySubjectFormComponent } from './modal-mysubject/my-subject';
import { MyTopicFormComponent } from './modal-create-topic/modal';
import { pick } from 'lodash';
import {
  ICategory,
  IMyCategory,
  IMySubject,
  IMyTopic,
  ISubject,
  ITopic
} from 'src/app/interface';
import {
  AppService,
  MyCategoryService,
  MySubjectService,
  MyTopicService,
  STATE,
  StateService
} from 'src/app/services';

@Component({
  selector: 'app-my-category',
  templateUrl: './my-category.html'
})
export class MyCategoriesComponent implements OnInit {
  public categories: ICategory[] = [];
  public myCategories: IMyCategory[] = [];
  public mySubjects: IMySubject[] = [];
  public myTopics: IMyTopic[] = [];
  public filterMyCategory: any = {
    currentPage: 1,
    pageSize: 10,
    sortOption: {
      sortBy: 'createdAt',
      sortType: 'desc'
    },
    total: 0,
    loading: false
  };

  public filterMySubject: any = {
    currentPage: 1,
    pageSize: 10,
    sortOption: {
      sortBy: 'createdAt',
      sortType: 'desc'
    },
    myCategoryId: '',
    total: 0,
    loading: false
  };

  public filterMyTopic: any = {
    currentPage: 1,
    pageSize: 10,
    sortOption: {
      sortBy: 'createdAt',
      sortType: 'desc'
    },
    mySubjectId: '',
    total: 0,
    loading: false
  };

  public tab = 'category';
  public checkMobileBrowser = false;
  public loading = false;
  public selectedCategory: IMyCategory;
  public selectedSubject: IMySubject;
  public config: any;

  constructor(
    private myCategoryService: MyCategoryService,
    private mySubjectService: MySubjectService,
    private myTopicService: MyTopicService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    public stateService: StateService,
    private appService: AppService
  ) {
    this.config = this.stateService.getState(STATE.CONFIG);
    this.categories = this.route.snapshot.data['categories'];
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      this.checkMobileBrowser = true;
    }
  }

  ngOnInit() {
    this.queryMyCategories();
  }

  queryMyCategories() {
    this.filterMyCategory.loading = true;
    this.myCategoryService
      .getListOfMe({
        page: this.filterMyCategory.currentPage,
        take: this.filterMyCategory.pageSize,
        sort: `${this.filterMyCategory.sortOption.sortBy}`,
        sortType: `${this.filterMyCategory.sortOption.sortType}`
      })
      .then((resp) => {
        if (resp.data && resp.data.items) {
          this.filterMyCategory.total = resp.data.count;
          this.myCategories = resp.data.items;
        }
        this.filterMyCategory.loading = false;
        this.mySubjects = [];
        this.myTopics = [];
      })
      .catch((err) => {
        this.filterMyCategory.loading = false;
        return this.appService.toastError(err);
      });
  }

  queryMySubjects() {
    this.filterMySubject.loading = true;
    this.mySubjectService
      .getListOfMe({
        page: this.filterMySubject.currentPage,
        take: this.filterMySubject.pageSize,
        sort: `${this.filterMySubject.sortOption.sortBy}`,
        sortType: `${this.filterMySubject.sortOption.sortType}`,
        myCategoryId: this.filterMySubject.myCategoryId
      })
      .then((resp) => {
        if (resp.data && resp.data.items) {
          this.filterMySubject.total = resp.data.count;
          this.mySubjects = resp.data.items;
        }
        this.filterMySubject.loading = false;
        this.myTopics = [];
      })
      .catch((err) => {
        this.filterMySubject.loading = false;
        return this.appService.toastError(err);
      });
  }

  queryMyTopics() {
    this.filterMyTopic.loading = true;
    this.myTopicService
      .getListOfMe({
        page: this.filterMyTopic.currentPage,
        take: this.filterMyTopic.pageSize,
        sort: `${this.filterMyTopic.sortOption.sortBy}`,
        sortType: `${this.filterMyTopic.sortOption.sortType}`,
        mySubjectId: this.filterMyTopic.mySubjectId,
        myCategoryId: this.selectedCategory._id
      })
      .then((resp) => {
        if (resp.data && resp.data.items) {
          this.filterMyTopic.total = resp.data.count;
          this.myTopics = resp.data.items;
        }
        this.filterMyTopic.loading = false;
      })
      .catch((err) => {
        this.filterMyTopic.loading = false;
        return this.appService.toastError(err);
      });
  }

  pageChange(target: 'subject' | 'category' | 'topic') {
    $('html, body').animate({ scrollTop: 0 });
    if (target === 'category') {
      this.queryMyCategories();
    } else if (target === 'subject') {
      this.queryMySubjects();
    } else {
      this.queryMyTopics();
    }
  }

  sortBy(
    target: 'subject' | 'category' | 'topic',
    field: string,
    type: string
  ) {
    if (target === 'category') {
      this.filterMyCategory.sortOption.sortBy = field;
      this.filterMyCategory.sortOption.sortType = type;
      this.queryMyCategories();
    } else if (target === 'subject') {
      this.filterMySubject.sortOption.sortBy = field;
      this.filterMySubject.sortOption.sortType = type;
      this.queryMySubjects();
    } else {
      this.filterMyTopic.sortOption.sortBy = field;
      this.filterMyTopic.sortOption.sortType = type;
      this.queryMyTopics();
    }
  }

  onSort(target: 'subject' | 'category' | 'topic', evt: any) {
    if (target === 'category') {
      this.filterMyCategory.sortOption = evt;
      this.queryMyCategories();
    } else if (target === 'subject') {
      this.filterMySubject.sortOption = evt;
      this.queryMySubjects();
    } else {
      this.filterMyTopic.sortOption = evt;
      this.queryMyTopics();
    }
  }

  onTabSelect(tab: string) {
    this.tab = tab;
  }

  submitCategory(myCategory = { isActive: true } as IMyCategory) {
    const modalRef = this.modalService.open(MyCategoryFormComponent, {
      centered: true,
      backdrop: 'static',
      size: 'md'
    });
    modalRef.componentInstance.categories = this.categories;
    modalRef.componentInstance.myCategory = myCategory;
    modalRef.result.then(
      (res) => {
        if (myCategory._id) {
          this.myCategoryService
            .update(myCategory._id, { ...res })
            .then((resp) => {
              if (resp.data) {
                this.appService.toastSuccess('Updated successfully!');
              }
            })
            .catch((err) => {
              this.appService.toastError(err);
            });
        } else {
          this.myCategoryService
            .create({ ...res })
            .then((resp) => {
              if (resp.data) {
                this.myCategories.push({ ...resp.data });
                this.appService.toastSuccess('Created successfully!');
              }
            })
            .catch((err) => {
              this.appService.toastError(err);
            });
        }
      },
      () => {
        return;
      }
    );
  }

  selectMyCategory(category: IMyCategory) {
    this.selectedCategory = category;
    this.selectedSubject = null as any;
    this.tab = 'subject';
    this.filterMySubject.myCategoryId = category._id;
    this.mySubjects = [];
    this.myTopics = [];
    this.queryMySubjects();
  }

  submitSubject(mySubject = { isActive: true } as IMySubject) {
    const modalRef = this.modalService.open(MySubjectFormComponent, {
      centered: true,
      backdrop: 'static',
      size: 'md'
    });
    modalRef.componentInstance.selectedCategory = this.selectedCategory;
    modalRef.componentInstance.mySubject = mySubject;
    modalRef.result.then(
      (res) => {
        if (mySubject._id) {
          this.mySubjectService
            .update(mySubject._id, {
              ...res,
              myCategoryId: this.selectedCategory._id
            })
            .then((resp) => {
              if (resp.data) {
                this.appService.toastSuccess('Updated successfully!');
              }
            })
            .catch((err) => {
              this.appService.toastError(err);
            });
        } else {
          this.mySubjectService
            .create({ ...res, myCategoryId: this.selectedCategory._id })
            .then((resp) => {
              if (resp.data) {
                this.mySubjects.push({ ...resp.data });
                this.appService.toastSuccess('Created successfully!');
              }
            })
            .catch((err) => {
              this.appService.toastError(err);
            });
        }
      },
      () => {
        return;
      }
    );
  }

  selectMySubject(subject: IMySubject) {
    this.selectedSubject = subject;
    this.tab = 'topic';
    this.filterMyTopic.mySubjectId = subject._id;
    this.myTopics = [];
    this.queryMyTopics();
  }

  submitTopic(myTopic = { isActive: true } as IMyTopic) {
    const modalRef = this.modalService.open(MyTopicFormComponent, {
      centered: true,
      backdrop: 'static',
      size: 'md'
    });
    modalRef.componentInstance.selectedSubject = this.selectedSubject;
    modalRef.componentInstance.myTopic = myTopic;
    modalRef.result.then(
      (res) => {
        if (myTopic._id) {
          this.myTopicService
            .update(myTopic._id, {
              ...res,
              myCategoryId: this.selectedCategory._id,
              mySubjectId: this.selectedSubject._id
            })
            .then((resp) => {
              if (resp.data) {
                this.appService.toastSuccess('Updated successfully!');
              }
            })
            .catch((err) => {
              this.appService.toastError(err);
            });
        } else {
          this.myTopicService
            .create({
              ...res,
              myCategoryId: this.selectedCategory._id,
              mySubjectId: this.selectedSubject._id
            })
            .then((resp) => {
              if (resp.data) {
                this.myTopics.push({ ...resp.data });
                this.appService.toastSuccess('Created successfully!');
              }
            })
            .catch((err) => {
              this.appService.toastError(err);
            });
        }
      },
      () => {
        return;
      }
    );
  }

  changeStatus(type: 'subject' | 'category' | 'topic', item: any) {
    const service =
      type === 'category'
        ? this.myCategoryService
        : type === 'subject'
        ? this.mySubjectService
        : this.myTopicService;
    service
      .changeStatus(item._id)
      .then((resp) => {
        item.isActive = !item.isActive;
        this.appService.toastSuccess(
          `${!item.isActive ? 'Deactivated' : 'Activated'} successfully!`
        );
        // if (!item.isActive) {
        //   if (
        //     type === 'category' &&
        //     this.selectedCategory &&
        //     item._id === this.selectedCategory._id
        //   ) {
        //     this.mySubjects = [];
        //     this.myTopics = [];
        //   } else if (
        //     type === 'subject' &&
        //     this.selectedSubject &&
        //     item._id === this.selectedSubject._id
        //   ) {
        //     this.myTopics = [];
        //   }
        // }
      })
      .catch((err) => {
        this.appService.toastError(err);
      });
  }

  remove(type: 'subject' | 'category' | 'topic', item: any, index: number) {
    if (window.confirm(`Are you sure want to remove this ${type}?`)) {
      const service =
        type === 'category'
          ? this.myCategoryService
          : type === 'subject'
          ? this.mySubjectService
          : this.myTopicService;

      service.delete(item._id).then((resp) => {
        this.appService.toastSuccess(`Remove ${type} successfully`);

        if (type === 'category') {
          if (this.selectedCategory && item._id === this.selectedCategory._id) {
            this.queryMyCategories();
          } else this.myCategories.splice(index, 1);
        } else if (type === 'subject') {
          if (this.selectedSubject && item._id === this.selectedSubject._id) {
            this.queryMySubjects();
          } else this.mySubjects.splice(index, 1);
        } else this.myTopics.splice(index, 1);
      });
    }
  }
}
