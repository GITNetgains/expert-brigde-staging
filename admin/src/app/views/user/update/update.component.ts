import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  UserService,
  UtilService,
  TutorService,
  CategoryService,
  SubjectService
} from 'src/services';
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
  ModalComponent,
  ModalHeaderComponent,
  ModalBodyComponent,
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
    GutterDirective,
    ProfileCardComponent,
    NgSelectModule,
     ModalComponent,
    ModalHeaderComponent,
    ModalBodyComponent,
   

    
  ]
})
export class UpdateComponent implements OnInit {

  // ===== BASIC USER STATE =====
  public info!: IUser;
  public userId: string | null = null;
  public loading = false;
  public isSubmitted = false;
  public customStylesValidated = false;
  public avatarUrl = '';

  // ===== TUTORS / CATEGORY =====
  public tutors: any[] = [];
  public assignedTutorObjects: any[] = [];
  public categories: any[] = [];
  public subjects: any[] = [];
  public selectedCategoryId = '';
  public selectedSubjectId = '';

  // ===== AI QUERIES =====

  aiQueries: any[] = [];

  // ===== SERVICES =====
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
      this.loadAiQueries();
    } else {
      this.router.navigate(['/users/list']);
    }
  }

  // ================== CATEGORIES ==================

  loadCategories() {
    this.categoryService
      .search({ take: 100, sort: 'ordering', sortType: 'asc' })
      .subscribe(resp => {
        this.categories = resp.data.items;
      });
  }

  // ================== AI QUERIES ==================
isUpdateMode = true;




showAssignModal = false;
activeQuery: any = null;

assign = {
  categoryId: '',
  subjectId: '',
  subjects: [],
  tutors: [],
  tutorIds: []
};

openAssignTutorModal(q: any) {
  this.activeQuery = q;

  this.assign = {
    categoryId: q.categoryId || '',
    subjectId: q.subjectId || '',
    subjects: [],
    tutors: [],
    tutorIds: q.assignedTutors?.map((t: any) => t._id) || []
  };

  this.showAssignModal = true;

  // Load subjects if category already exists
  if (this.assign.categoryId) {
    this.loadSubjects(true);
  }
}

loadSubjects(preselect = false) {
  this.assign.subjects = [];
  this.assign.tutors = [];

  if (!this.assign.categoryId) return;

  this.subjectService.search({
    categoryIds: this.assign.categoryId,
    take: 100
  }).subscribe(res => {
    this.assign.subjects = res.data.items || [];

    // Auto load tutors if subject already exists
    if (preselect && this.assign.subjectId) {
      this.loadTutors();
    }
  });
}

loadTutors() {
  this.assign.tutors = [];

  if (!this.assign.subjectId) return;

  this.tutorService.search({
    subjectIds: this.assign.subjectId,
    pendingApprove: false,
    rejected: false,
    isActive: true,
    take: 1000
  }).subscribe(res => {
    this.assign.tutors = res.data.items || [];
  });
}

saveTutorAssignment() {
  this.userService.assignTutorToAiQuery(
    this.userId!,
    this.activeQuery._id,
    this.assign.tutorIds
  ).subscribe(() => {
    this.activeQuery.assignedTutors =
      this.assign.tutors.filter(t =>
        (this.assign.tutorIds as string[]).includes((t as any)._id)
      );

    this.showAssignModal = false;
    this.utilService.toastSuccess({ message: 'Tutors assigned' });
  });
}

deleteAiQuery(q: any) {
  if (!confirm('Delete this AI query?')) return;

  this.userService.deleteAiQuery(this.userId!, q._id)
    .subscribe(() => {
      this.aiQueries = this.aiQueries.filter(x => x._id !== q._id);
      this.utilService.toastSuccess({ message: 'Query deleted' });
    });
}

loadAiQueries() {
  if (!this.userId) return;

  this.userService.getAiQueries(this.userId).subscribe({
    next: (resp) => {
      this.aiQueries = (resp as any).data.map((q: any) => ({
        ...q,
        assignedTutors: q.assignedTutors || []
      }));
    },
    error: () => {
      this.utilService.toastError({
        message: 'Failed to load AI queries'
      });
    }
  });
}

showDescriptionModal = false;
activeDescription = '';

openDescriptionModal(q: any) {
  this.activeDescription = q.description;
  this.showDescriptionModal = true;
}

sortAiQueries(type: 'newest' | 'oldest') {
  this.aiQueries = [...this.aiQueries].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();

    return type === 'newest'
      ? dateB - dateA
      : dateA - dateB;
  });
}


  onAiCategoryChange(q: any) {
    q._subjectId = '';
    q._subjects = [];
    q._tutors = [];

    if (!q._categoryId) return;

    this.subjectService.search({
      take: 100,
      categoryIds: q._categoryId,
      sort: 'ordering',
      sortType: 'asc'
    }).subscribe(resp => {
      q._subjects = resp.data.items;
    });
  }

onAiSubjectChange(q: any) {
  const alreadyAssigned = q._tutors || [];

  if (!q._subjectId) return;

  this.tutorService.search({
    take: 1000,
    subjectIds: q._subjectId,
    pendingApprove: false,
    rejected: false,
    isActive: true
  }).subscribe(resp => {
    const merged = [...alreadyAssigned, ...resp.data.items];

    // remove duplicates
    q._tutors = Array.from(
      new Map(merged.map((t: any) => [t._id, t])).values()
    );
  });
}


  saveAiTutorAssignment(q: any) {
    this.userService.assignTutorToAiQuery(
      this.userId as string,
      q._id,
      q.assignedTutors || []
    ).subscribe({
      next: () => {
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'Tutor assigned successfully'
        });
      },
      error: () => {
        this.utilService.toastError({
          title: 'Error',
          message: 'Failed to assign tutor'
        });
      }
    });
  }

  // ================== USER DATA ==================

  private loadUserData() {
    this.loading = true;

    this.userService.findOne(this.userId as string).subscribe({
      next: (resp) => {
        const assigned = resp.data.assignedTutors || [];

        this.assignedTutorObjects = typeof assigned[0] === 'object'
          ? assigned
          : [];

        this.tutors = [...this.assignedTutorObjects];

        this.info = {
          ...resp.data,
          assignedTutors: assigned.map((t: any) => t._id),
          password: ''
        };

        this.avatarUrl = resp.data.avatarUrl;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.utilService.toastError({
          title: 'Error',
          message: 'Could not load user data'
        });
      }
    });
  }

  // ================== SAVE ==================

  submit(form: any) {
    this.isSubmitted = true;
    this.customStylesValidated = true;

    if (!form.valid) return;

    const data = { ...this.info };
    if (!data.password) delete data.password;

    this.loading = true;

    this.userService.update(this.userId as string, data).subscribe({
      next: () => {
        this.loading = false;
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'User updated successfully'
        });
        this.router.navigate(['/users/list']);
      },
      error: (err) => {
        this.loading = false;
        this.utilService.toastError({
          title: 'Error',
          message: err.error?.message || 'Update failed'
        });
      }
    });
  }

  afterUpload(evt: any) {
    this.info.avatar = evt;
  }
}
