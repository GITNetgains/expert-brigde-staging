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
  FormControlDirective,
} from '@coreui/angular';
import { DatePickerCustomComponent } from '@components/common/date-picker-custom/date-picker-custom.component';
import { Dayjs } from 'dayjs';
import { IDatePickerOptions } from 'src/interfaces';

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
    FormControlDirective,
    DatePickerCustomComponent,
  ],
})
export class ListComponent implements OnInit {
  loading = false;
  allAiQueries: any[] = [];
  aiQueries: any[] = [];
  searchFields = { name: '', email: '' };
  dateChange: any;

  public datePickerOptions: IDatePickerOptions = {
    singleDatePicker: false,
    onSelectedDate: this.onSelectedDate.bind(this),
    autoApply: false,
    closeOnApply: true,
  };

  onSelectedDate(event: { startDate: Dayjs; endDate: Dayjs }) {
    if (!event) {
      return;
    }
    this.dateChange = event;
    this.doSearch();
  }

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
  private tutorRequestSequence = 0;

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
        this.allAiQueries = ((resp as any).data || []).map((q: any) => ({
          ...q,
          assignedTutors: q.assignedTutors || [],
        }));
        this.doSearch();
        this.loading = false;
      },
      error: () => {
        this.utilService.toastError({ message: 'Failed to load AI queries' });
        this.loading = false;
      },
    });
  }

  timeout: any;
  doSearch() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      const nameQ = this.searchFields.name.toLowerCase().trim();
      const emailQ = this.searchFields.email.toLowerCase().trim();
      let startT = 0;
      let endT = Infinity;
      if (this.dateChange?.startDate) {
        startT = new Date(this.dateChange.startDate).getTime();
      }
      if (this.dateChange?.endDate) {
        endT = new Date(this.dateChange.endDate).getTime() + 86400000;
      }
      
      this.aiQueries = this.allAiQueries.filter((q) => {
        const matchName = !nameQ || (q.userName && q.userName.toLowerCase().includes(nameQ));
        const matchEmail = !emailQ || (q.userEmail && q.userEmail.toLowerCase().includes(emailQ));
        const qTime = new Date(q.createdAt).getTime();
        const matchDate = (!startT || qTime >= startT) && (endT === Infinity || qTime < endT);
        return matchName && matchEmail && matchDate;
      });
    }, 300);
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
    this.tutorRequestSequence += 1;
    this.assign.subjects = [];
    this.assign.tutors = [];
    if (!preselect) {
      this.assign.subjectId = '';
      this.assign.tutorIds = [];
    }

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
    const currentRequest = ++this.tutorRequestSequence;
    const fetchedTutors: any[] = [];
    const take = 500;
    let page = 1;

    const fetchNextPage = () => {
      this.tutorService
        .search({
          subjectIds: this.assign.subjectId,
          pendingApprove: false,
          rejected: false,
          isActive: true,
          take,
          page,
          sort: 'name',
          sortType: 'asc',
        })
        .subscribe((res) => {
          if (currentRequest !== this.tutorRequestSequence) return;

          const items = res?.data?.items || [];
          const total = res?.data?.count || 0;
          fetchedTutors.push(...items);

          if (fetchedTutors.length < total && items.length > 0) {
            page += 1;
            fetchNextPage();
            return;
          }

          const subjectTutors = Array.from(
            new Map(
              fetchedTutors.map((t) => [String(t._id || t.id), t])
            ).values()
          );
          const allowedTutorIds = new Set(
            subjectTutors.map((t) => String(t._id || t.id))
          );
          this.assign.tutorIds = (this.assign.tutorIds || []).filter((id) =>
            allowedTutorIds.has(String(id))
          );
          this.assign.tutors = subjectTutors;
        });
    };

    fetchNextPage();
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
