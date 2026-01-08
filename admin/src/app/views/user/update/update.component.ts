import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService, UtilService, TutorService, CategoryService, SubjectService } from 'src/services';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  ButtonDirective,
  CardComponent,
  CardBodyComponent,
  CardHeaderComponent,
  InputGroupComponent,
  FormControlDirective,
  FormDirective,
  FormLabelDirective,
  FormFeedbackComponent,
  RowComponent,
  ColComponent,
  GutterDirective,
} from '@coreui/angular';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { IUser } from 'src/interfaces';

@Component({
  selector: 'app-user-update',
  templateUrl: '../form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    InputGroupComponent,
    FormControlDirective,
    FormDirective,
    FormLabelDirective,
    FormFeedbackComponent,
    RowComponent,
    ColComponent,
    ProfileCardComponent,
    GutterDirective,
    NgSelectModule
  ],
})
export class UpdateComponent implements OnInit {
  public info!: IUser;
  public avatarUrl = '';
  public isSubmitted = false;
  public user!: IUser;
  public userId: string | null = null;
  public loading = false;
  public customStylesValidated = false;
  public tutors: any[] = [];
  public assignedTutorObjects: any[] = [];
  
  public categories: any[] = [];
  public subjects: any[] = [];
  public selectedCategoryId: string = '';
  public selectedSubjectId: string = '';

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private utilService = inject(UtilService);
  private tutorService = inject(TutorService);
  private categoryService = inject(CategoryService);
  private subjectService = inject(SubjectService);

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.loadCategories();
    
    if (this.userId) {
      this.loadUserData();
    } else {
      this.router.navigate(['/users/list']);
    }
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
    
    // Reset tutors to only assigned ones when category changes
    this.tutors = [...this.assignedTutorObjects];

    if (categoryId) {
      this.subjectService.search({ take: 100, categoryIds: categoryId, sort: 'ordering', sortType: 'asc' }).subscribe((resp) => {
        this.subjects = resp.data.items;
      });
    }
  }

  onSubjectChange(subject: any) {
    const subjectId = subject && subject._id ? subject._id : subject;
    this.selectedSubjectId = subjectId;
    
    if (subjectId) {
      this.loadFilteredTutors();
    } else {
      // Reset if subject is cleared
      this.tutors = [...this.assignedTutorObjects];
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
        const newTutors = resp.data.items;
        // Merge with assignedTutorObjects to ensure assigned tutors are still visible
        const merged = [...this.assignedTutorObjects, ...newTutors];
        this.tutors = Array.from(new Map(merged.map(item => [item._id, item])).values());
      },
      error: (err) => {
        console.error('Failed to load tutors', err);
      }
    });
  }

  private loadUserData() {
    this.loading = true;
    this.userService.findOne(this.userId as string).subscribe({
      next: (resp) => {
        this.user = resp.data;
        const assigned = resp.data.assignedTutors || [];
        let assignedIds: any[] = [];
        
        if (assigned.length > 0 && typeof assigned[0] === 'object') {
          this.assignedTutorObjects = assigned;
          this.tutors = [...assigned];
          assignedIds = assigned.map((t: any) => t._id);
        } else {
          assignedIds = assigned;
        }

        this.info = {
          _id: resp.data._id,
          name: resp.data.name,
          email: resp.data.email,
          isActive: resp.data.isActive,
          emailVerified: resp.data.emailVerified,
          address: resp.data.address,
          bio: resp.data.bio,
          role: resp.data.role,
          type: resp.data.type,
          phoneNumber: resp.data.phoneNumber,
          avatarUrl: resp.data.avatarUrl,
          createdAt: resp.data.createdAt,
          assignedTutors: assignedIds,
          password: '',
        };
        this.avatarUrl = resp.data.avatarUrl;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.utilService.toastError({
          title: 'Error',
          message: 'Could not load user data',
        });
      },
    });
  }

  submit(form: any) {
    this.isSubmitted = true;
    this.customStylesValidated = true;
    if (!form.valid) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Please check the form and try again',
      });
      return;
    }

    const data = { ...this.info };

    if (!data.password) {
      delete data.password;
    }

    this.loading = true;
    this.userService.update(this.userId as string, data).subscribe({
      next: (resp) => {
        this.loading = false;
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'User updated successfully',
        });
        this.router.navigate(['/users/list']);
      },
      error: (err) => {
        this.loading = false;
        this.utilService.toastError({
          title: 'Error',
          message: err.error?.message || 'Update failed',
        });
      },
    });
  }

  afterUpload(evt: any) {
    this.info.avatar = evt;
  }
}
