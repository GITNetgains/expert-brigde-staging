import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, UtilService, TutorService, CategoryService, SubjectService } from 'src/services';
import { ToasterPlacement } from '@coreui/angular';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  ButtonDirective,
  CardComponent,
  CardBodyComponent,
  CardHeaderComponent,
  FormControlDirective,
  FormDirective,
  FormLabelDirective,
  FormFeedbackComponent,
  RowComponent,
  ColComponent,
  GutterDirective,
  ModalComponent,
ModalHeaderComponent,
ModalBodyComponent
} from '@coreui/angular';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { IUser } from 'src/interfaces';
@Component({
  selector: 'app-user-create',
  templateUrl: '../form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    FormControlDirective,
    FormDirective,
    FormLabelDirective,
    FormFeedbackComponent,
    RowComponent,
    ColComponent,
    ProfileCardComponent,
    GutterDirective,
    NgSelectModule,
    ModalComponent,
ModalHeaderComponent,
ModalBodyComponent
  ],
})
export class CreateComponent implements OnInit {
  public info: IUser = {
    _id: '',
    type: 'student',
    name: '',
    email: '',
    address: '',
    phoneNumber: '',
    role: 'user',
    emailVerified: true,
    isActive: true,
    avatarUrl: '',
    avatar: '',
    password: '',
    assignedTutors: []
  };
  public isSubmitted = false;
  public loading = false;
  public userId: string | null = null;
  public customStylesValidated = false;
  public tutors: any[] = [];

  public categories: any[] = [];
  public subjects: any[] = [];
  public selectedCategoryId: string = '';
  public selectedSubjectId: string = '';

  private router = inject(Router);
  private userService = inject(UserService);
  private utilService = inject(UtilService);
  private tutorService = inject(TutorService);
  private categoryService = inject(CategoryService);
  private subjectService = inject(SubjectService);

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.search({ take: 100, sort: 'ordering', sortType: 'asc' }).subscribe((resp) => {
      this.categories = resp.data.items;
    });
  }

  onCategoryChange(category: any) {
    const categoryId = category && category._id ? category._id : category;
    this.selectedCategoryId = categoryId;
    this.subjects = [];
    this.selectedSubjectId = '';
    this.tutors = []; // Clear tutors when category changes

    if (categoryId) {
      this.subjectService.search({ take: 100, categoryIds: categoryId, sort: 'ordering', sortType: 'asc' }).subscribe((resp) => {
        this.subjects = resp.data.items;
      });
    }
  }
  // ===== UPDATE-ONLY SAFE DEFAULTS =====
isUpdateMode = false;

showAssignModal = false;
showDescriptionModal = false;
activeDescription = '';
assign = {
  categoryId: '',
  subjectId: '',
  subjects: [],
  tutors: [],
  tutorIds: []
};
public aiQueries: any[] = [];
loadSubjects() {}
loadTutors() {}
saveTutorAssignment() {}
openAssignTutorModal(_: any) {}
deleteAiQuery(_: any) {}


  onSubjectChange(subject: any) {
    const subjectId = subject && subject._id ? subject._id : subject;
    this.selectedSubjectId = subjectId;
    this.tutors = []; // Clear tutors when subject changes

    if (subjectId) {
      this.loadFilteredTutors();
    }
  }

  loadFilteredTutors() {
    if (!this.selectedSubjectId) return;

    const params: any = {
      take: 1000,
      subjectIds: this.selectedSubjectId,
      pendingApprove: false,
      rejected: false,
      isActive: true
    };

    this.tutorService.search(params).subscribe({
      next: (resp) => {
        this.tutors = resp.data.items;
      },
      error: (err) => {
        console.error('Failed to load tutors', err);
      }
    });
  }

  submit(form: any) {
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
      name: this.info.name,
      email: this.info.email,
      role: this.info.role,
      isActive: this.info.isActive,
      emailVerified: this.info.emailVerified,
      address: this.info.address,
      type: this.info.type,
      password: this.info.password,
      phoneNumber: this.info.phoneNumber,
      avatar: this.info.avatar,
      assignedTutors: this.info.assignedTutors
    };

    this.loading = true;
    this.userService.create(data).subscribe({
      next: (resp) => {
        this.loading = false;
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'User created successfully!',
        });
        this.router.navigate(['/users/list']);
      },
      error: (err) => {
        this.loading = false;
        if (
          err.error?.message?.includes('duplicate key') &&
          err.error?.message?.includes('email')
        ) {
          this.utilService.toastError({
            title: 'Email Already Exists',
            message: `The email "${this.info.email}" is already registered in the system. Please use a different email address.`,
          });
        } else {
          this.utilService.toastError({
            title: 'Error',
            message: err.error?.message || 'Failed to create user',
          });
        }
      },
    });
  }

  afterUpload(evt: string) {
    this.info.avatar = evt;
  }
}
