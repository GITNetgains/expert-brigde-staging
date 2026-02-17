import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppService, AuthService, SeoService, UserService, TutorService } from 'src/app/services';

@Component({
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

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private tutorService: TutorService,
    private seo: SeoService,
    private appService: AppService,
    private router: Router
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
  selectedQuery: any = null;

openDescription(q: any) {
  this.selectedQuery = q;
}

closeDescription() {
  this.selectedQuery = null;
}

openAttachments(file: any) {
  if (!file) return;

  const url = file.fileUrl || file.url;
  if (url) {
    window.open(url, '_blank');
  } else {
    this.appService.toastError('File URL not found');
  }
}

getTutorDisplayName(tutor: any): string {
  const id = tutor?._id || tutor?.id || '';
  const detail = id ? this.tutorCache[id] : null;
  const rawFlag =
    (detail && (detail.showPublicIdOnly ?? detail.profile?.showPublicIdOnly)) ??
    tutor?.showPublicIdOnly;
  const onlyPublicId = typeof rawFlag === 'string' ? rawFlag === 'true' : !!rawFlag;
  if (onlyPublicId) {
    return (detail && detail.userId) || tutor.userId || '';
  }
  return (
    (detail && (detail.profile?.name || detail.name || detail.username || detail.email)) ||
    tutor?.profile?.name ||
    tutor?.name ||
    tutor?.username ||
    tutor?.email ||
    'Expert'
  );
}

query() {
  this.loading = true;

  const params = {
    page: this.currentPage,
    take: this.pageSize,
    sort: this.sortOption.sortBy,
    sortType: this.sortOption.sortType,
    ...this.searchFields
  };

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

  for (const q of this.items) {
    for (const t of q?.assignedTutors || []) {
      const id = t?._id || t?.id;
      if (id && !this.tutorCache[id]) {
        ids.add(id);
      }
    }
  }

  if (!ids.size) return; // ✅ IMPORTANT

  Promise.all(
    Array.from(ids).map(id =>
      this.tutorService.findOne(id)
        .then(resp => this.tutorCache[id] = resp?.data || {})
        .catch(() => {})
    )
  );
}



  pageChange(page: number) {
    this.currentPage = page;
    this.query();
  }

  goToExperts() {
    this.router.navigate(['/experts']);
  }

  goToQueryExperts(q: any) {
    const tutors = q?.assignedTutors || [];
    const ids = tutors
      .map((t: any) => {
        const raw = t?._id ?? t?.id;
        return raw != null ? String(raw) : '';
      })
      .filter((id: string) => id.length > 0);
    if (ids.length) {
      this.router.navigate(['/experts'], { queryParams: { ids: ids.join(','), page: 1 } });
    } else {
      this.appService.toastError('No experts assigned to this query');
    }
  }

  openTutorProfile(tutor: any) {
    const username = tutor?.username || '';
    if (username) {
      this.router.navigate(['/experts', username]);
      return;
    }
    const id = tutor?._id || tutor?.id || '';
    if (id) {
      this.tutorService.findOne(id).then((resp: any) => {
        const data = resp?.data || {};
        const uname = data?.username || '';
        if (uname) this.router.navigate(['/experts', uname]);
      }).catch(() => {});
    }
  }
}
