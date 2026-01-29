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

// AI QUERIES
public aiQueries: any[] = [];

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

public assign: {
  categoryId: string;
  subjectId: string;
  subjects: any[];
  tutors: any[];
  tutorIds: string[];
} = {
  categoryId: '',
  subjectId: '',
  subjects: [],
  tutors: [],
  tutorIds: []
};
openAssignTutorModal(q: any) {
  this.activeQuery = q;

  // 1️⃣ Extract assigned tutor IDs
  const assignedTutorIds = q.assignedTutors?.map((t: any) => t._id) || [];

  // 2️⃣ Seed tutors list with already assigned tutors
  const assignedTutorObjects = q.assignedTutors || [];

  this.assign = {
    categoryId: q.categoryId || '',
    subjectId: q.subjectId || '',
    subjects: [],
    tutors: [...assignedTutorObjects], // ✅ KEY FIX
    tutorIds: assignedTutorIds
  };

  this.showAssignModal = true;

  // 3️⃣ Load subjects → tutors (will MERGE later)
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
  if (!this.assign.subjectId) return;

  this.tutorService.search({
    subjectIds: this.assign.subjectId,
    pendingApprove: false,
    rejected: false,
    isActive: true,
    take: 1000
  }).subscribe(res => {
    const fetchedTutors = res.data.items || [];

    // ✅ MERGE assigned + fetched, remove duplicates
    const merged = [...this.assign.tutors, ...fetchedTutors];

    this.assign.tutors = Array.from(
      new Map(merged.map(t => [t._id, t])).values()
    );
  });
}

saveTutorAssignment() {
  const selectedTutorIds = this.assign.tutorIds as string[];
  const queryId = this.activeQuery?._id || this.activeQuery?.id;

  if (!queryId) {
    this.utilService.toastError({ message: 'Query ID not found' });
    return;
  }

  this.userService.assignTutorToAiQuery(
    this.userId!,
    queryId,
    selectedTutorIds
  ).subscribe({
    next: () => {
      // 1. Update the table list (aiQueries)
      const updatedTutorObjects = this.assign.tutors.filter((t: any) =>
        selectedTutorIds.includes(t._id || t.id)
      );

      const queryIndex = this.aiQueries.findIndex((q: any) => (q._id || q.id) === queryId);
      if (queryIndex !== -1) {
        this.aiQueries[queryIndex].assignedTutors = updatedTutorObjects;
      }

      // 2. IMPORTANT: Update the main 'info' object. 
      // This ensures that when you click the main "Save" button, 
      // the data sent to the backend includes these assignments.
      if (this.info) {
        // Sync global assignedTutors (Unique list)
        const currentGlobalIds = new Set<string>(this.info.assignedTutors || []);
        selectedTutorIds.forEach(id => currentGlobalIds.add(id));
        this.info.assignedTutors = Array.from(currentGlobalIds);

        // Sync the specific query inside info.aiQueries if it exists
        if ((this.info as any).aiQueries) {
          const infoQueryIdx = (this.info as any).aiQueries.findIndex((q: any) => (q._id || q.id) === queryId);
          if (infoQueryIdx !== -1) {
            (this.info as any).aiQueries[infoQueryIdx].assignedTutors = selectedTutorIds;
          }
        }
      }

      this.showAssignModal = false;
      this.utilService.toastSuccess({ message: 'Tutors assigned successfully' });
      
      // Reload to ensure frontend and backend are perfectly in sync
      this.loadUserData();
      this.loadAiQueries();
    },
    error: (err) => {
      this.utilService.toastError({ message: 'Failed to assign tutors' });
    }
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

      // Store the full tutor objects
      this.assignedTutorObjects = typeof assigned[0] === 'object'
        ? assigned
        : [];

      this.tutors = [...this.assignedTutorObjects];

      // ✅ Extract just the IDs for the form
      const assignedTutorIds = assigned.map((t: any) => 
        typeof t === 'object' ? t._id : t
      );

      this.info = {
        ...resp.data,
        assignedTutors: assignedTutorIds,
        password: ''
      };

      console.log('📦 Loaded user data:', {
        assignedTutorIds,
        assignedTutorObjects: this.assignedTutorObjects
      });

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

  // Clone data
  const data = { ...this.info };
  
  // Clean up password
  if (!data.password) delete data.password;

  // CRITICAL: Ensure the latest aiQueries are attached to the payload
  // so the main update doesn't wipe them out.
  (data as any).aiQueries = this.aiQueries;

  this.loading = true;
  this.userService.update(this.userId as string, data).subscribe({
    next: () => {
      this.loading = false;
      this.utilService.toastSuccess({ message: 'User updated successfully' });
      this.loadUserData();
      this.loadAiQueries();
    },
    error: (err) => {
      this.loading = false;
      this.utilService.toastError({ message: err.error?.message || 'Update failed' });
    }
  });
}

  afterUpload(evt: any) {
    this.info.avatar = evt;
  }
}
