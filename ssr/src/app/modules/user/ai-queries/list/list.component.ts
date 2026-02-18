import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppService, AuthService, SeoService, UserService, TutorService } from 'src/app/services';

@Component({
  selector: 'app-ai-query-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class AiQueryListComponent implements OnInit {
  loading = false;
  items: any[] = [];
  total = 0;
  currentPage = 1;
  pageSize = 10;
  sortOption: any = { sortBy: 'createdAt', sortType: 'desc' };
  searchFields: any = {};
  userId = '';
  tutorCache: Record<string, any> = {};

  // Modal State
  selectedQuery: any = null;
  activeModal: 'description' | 'experts' | null = null;

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private tutorService: TutorService,
    private seo: SeoService,
    private appService: AppService,
    public router: Router
  ) {
    this.seo.setMetaTitle('AI Query History');
  }

  ngOnInit() {
    if (this.auth.isLoggedin()) {
      this.auth.getCurrentUser().then((u: any) => {
        this.userId = u?._id || '';
        this.query();
      });
    } else {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/users/ai-queries' } });
    }
  }

  openDescription(q: any) {
    this.selectedQuery = q;
    this.activeModal = 'description';
  }

  openExpertsList(q: any) {
    if (!q.assignedTutors?.length) return;
    this.selectedQuery = q;
    this.activeModal = 'experts';
  }

  closeModal() {
    this.selectedQuery = null;
    this.activeModal = null;
  }

  openAttachments(file: any) {
    if (!file) return;
    const url = file.fileUrl || file.url;
    if (url) window.open(url, '_blank');
    else this.appService.toastError('File URL not found');
  }

  getTutorDisplayName(tutor: any): string {
    const id = tutor?._id || tutor?.id || '';
    const detail = this.tutorCache[id];
    if (detail?.showPublicIdOnly) return detail.userId || '';
    return detail?.name || detail?.username || tutor?.name || 'Expert';
  }

  query() {
    this.loading = true;
    const params = { page: this.currentPage, take: this.pageSize, sort: this.sortOption.sortBy, sortType: this.sortOption.sortType, ...this.searchFields };
    this.userService.searchAiQueries(this.userId, params)
      .then((resp: any) => {
        this.items = Array.isArray(resp?.data) ? resp.data : [];
        this.total = this.items.length;
        this.loading = false;
        this.preloadTutorDetails();
      })
      .catch(() => {
        this.loading = false;
        this.appService.toastError('Failed to load AI queries');
      });
  }

  preloadTutorDetails() {
    const ids = new Set<string>();
    this.items.forEach(q => q?.assignedTutors?.forEach((t: any) => {
      const id = t?._id || t?.id;
      if (id && !this.tutorCache[id]) ids.add(id);
    }));
    if (!ids.size) return;
    Array.from(ids).forEach(id => {
      this.tutorService.findOne(id).then(resp => this.tutorCache[id] = resp?.data || {});
    });
  }

  goToQueryExperts(q: any) {
    const ids = (q?.assignedTutors || []).map((t: any) => t?._id || t?.id).filter((id: any) => !!id);
    if (!ids.length) {
      this.appService.toastError('No assigned experts for this query');
      return;
    }
    this.router.navigate(['/experts'], { queryParams: { ids: ids.join(','), page: 1 } });
    this.closeModal();
  }
}