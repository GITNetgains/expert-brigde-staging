import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  UserService,
  UtilService,
  TutorService,
  CategoryService,
  SubjectService,
} from 'src/services';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  ButtonDirective,
  CardComponent,
  CardBodyComponent,
  CardHeaderComponent,
  RowComponent,
  ColComponent,
  ModalComponent,
  ModalHeaderComponent,
  ModalBodyComponent,
} from '@coreui/angular';

@Component({
  selector: 'app-queries-list',
  standalone: true,
  templateUrl: './list.component.html',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    RowComponent,
    ColComponent,
    NgSelectModule,
    ModalComponent,
    ModalHeaderComponent,
    ModalBodyComponent,
  ],
})
export class ListComponent implements OnInit {
  loading = false;
  aiQueries: any[] = [];

  showDescriptionModal = false;
  activeDescription = '';

  showAssignModal = false;
  activeQuery: any = null;

  assign: {
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
    tutorIds: [],
  };

  private userService = inject(UserService);
  private utilService = inject(UtilService);
  private tutorService = inject(TutorService);
  private categoryService = inject(CategoryService);
  private subjectService = inject(SubjectService);

  categories: any[] = [];

  ngOnInit() {
    this.loadCategories();
    this.loadAiQueries();
  }

  loadCategories() {
    this.categoryService
      .search({ take: 100, sort: 'ordering', sortType: 'asc' })
      .subscribe((resp) => {
        this.categories = resp.data.items;
      });
  }

  loadAiQueries() {
    this.loading = true;
    this.userService.getAllAiQueries().subscribe({
      next: (resp) => {
        this.aiQueries = ((resp as any).data || []).map((q: any) => ({
          ...q,
          assignedTutors: q.assignedTutors || [],
        }));
        this.loading = false;
      },
      error: () => {
        this.utilService.toastError({ message: 'Failed to load AI queries' });
        this.loading = false;
      },
    });
  }

  openDescriptionModal(q: any) {
    this.activeDescription = q.description || '';
    this.showDescriptionModal = true;
  }

  openAssignTutorModal(q: any) {
    this.activeQuery = q;
    const assignedTutorIds = q.assignedTutors?.map((t: any) => t._id || t.id) || [];
    const assignedTutorObjects = q.assignedTutors || [];

    this.assign = {
      categoryId: q.categoryId || '',
      subjectId: q.subjectId || '',
      subjects: [],
      tutors: [...assignedTutorObjects],
      tutorIds: assignedTutorIds,
    };

    this.showAssignModal = true;
    if (this.assign.categoryId) {
      this.loadSubjects(true);
    }
  }

  loadSubjects(preselect = false) {
    this.assign.subjects = [];
    this.assign.tutors = [];

    if (!this.assign.categoryId) return;

    this.subjectService
      .search({
        categoryIds: this.assign.categoryId,
        take: 100,
      })
      .subscribe((res) => {
        this.assign.subjects = res.data.items || [];
        if (preselect && this.assign.subjectId) {
          this.loadTutors();
        }
      });
  }

  loadTutors() {
    if (!this.assign.subjectId) return;

    this.tutorService
      .search({
        subjectIds: this.assign.subjectId,
        pendingApprove: false,
        rejected: false,
        isActive: true,
        take: 1000,
      })
      .subscribe((res) => {
        const fetchedTutors = res.data.items || [];
        const merged = [...this.assign.tutors, ...fetchedTutors];
        this.assign.tutors = Array.from(
          new Map(merged.map((t) => [t._id, t])).values()
        );
      });
  }

  saveTutorAssignment() {
    const selectedTutorIds = this.assign.tutorIds as string[];
    const queryId = this.activeQuery?._id || this.activeQuery?.id;
    const userId = this.activeQuery?.userId;

    if (!queryId || !userId) {
      this.utilService.toastError({ message: 'Query or user not found' });
      return;
    }

    this.userService
      .assignTutorToAiQuery(userId, queryId, selectedTutorIds)
      .subscribe({
        next: () => {
          const updatedTutorObjects = this.assign.tutors.filter((t: any) =>
            selectedTutorIds.includes(t._id || t.id)
          );
          const queryIndex = this.aiQueries.findIndex(
            (q: any) => (q._id || q.id) === queryId
          );
          if (queryIndex !== -1) {
            this.aiQueries[queryIndex].assignedTutors = updatedTutorObjects;
          }
          this.showAssignModal = false;
          this.utilService.toastSuccess({
            message: 'Experts assigned successfully',
          });
          this.loadAiQueries();
        },
        error: () => {
          this.utilService.toastError({ message: 'Failed to assign experts' });
        },
      });
  }

  deleteAiQuery(q: any) {
    if (!confirm('Delete this AI query?')) return;
    const userId = q.userId;
    if (!userId) return;
    this.userService.deleteAiQuery(userId, q._id).subscribe({
      next: () => {
        this.aiQueries = this.aiQueries.filter((x) => x._id !== q._id);
        this.utilService.toastSuccess({ message: 'Query deleted' });
      },
      error: () => {
        this.utilService.toastError({ message: 'Failed to delete query' });
      },
    });
  }

  notifyUser(q: any) {
    if (
      !confirm('Send email notification to user about assigned experts?')
    )
      return;
    const userId = q.userId;
    if (!userId) return;
    this.userService.notifyUserAboutAiQuery(userId, q._id).subscribe({
      next: () => {
        this.utilService.toastSuccess({ message: 'Email sent successfully' });
      },
      error: () => {
        this.utilService.toastError({ message: 'Failed to send email' });
      },
    });
  }

  getAttachmentDisplay(attachments: any[]): any[] {
    if (!attachments?.length) return [];
    return attachments.map((a) => ({
      name: a.name || a.originalName || 'File',
      fileUrl: a.fileUrl || a.filePath || '#',
    }));
  }
}
