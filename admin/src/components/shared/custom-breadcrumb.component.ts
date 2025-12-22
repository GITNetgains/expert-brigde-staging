import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterModule } from '@angular/router';
import { filter, map } from 'rxjs/operators';

interface BreadcrumbItem {
  label: string;
  url?: string;
  active: boolean;
}

@Component({
  selector: 'app-custom-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
        <li 
          *ngFor="let item of breadcrumbs; let last = last" 
          class="breadcrumb-item"
          [class.active]="item.active"
        >
          <a 
            *ngIf="item.url && !item.active; else plainText" 
            [routerLink]="item.url"
            class="text-decoration-none"
          >
            {{ item.label }}
          </a>
          <ng-template #plainText>
            {{ item.label }}
          </ng-template>
        </li>
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumb-item a {
      color: #E4543C ;
      text-decoration: none;
    }
    .breadcrumb-item a:hover {
      color: #E4543C ;
      text-decoration: underline;
    }
    .breadcrumb-item.active {
      color: #6c757d;
    }
  `]
})
export class CustomBreadcrumbComponent implements OnInit {
  breadcrumbs: BreadcrumbItem[] = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.buildBreadcrumb())
      )
      .subscribe(breadcrumbs => {
        this.breadcrumbs = breadcrumbs;
      });

    this.breadcrumbs = this.buildBreadcrumb();
  }

  private buildBreadcrumb(): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];
    
    breadcrumbs.push({
      label: 'Home',
      url: '/dashboard',
      active: false
    });

    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const title = route.snapshot.data['title'];
    if (title) {
      const titleParts = title.split(' / ');
      
      if (titleParts.length >= 2) {
        const sectionName = titleParts[0];
        const sectionUrl = this.getSectionUrl(sectionName);
        
        breadcrumbs.push({
          label: sectionName,
          url: sectionUrl,
          active: false
        });
        const pageName = titleParts[1];
        breadcrumbs.push({
          label: pageName,
          active: true
        });
      } else {
        breadcrumbs.push({
          label: title,
          active: true
        });
      }
    }

    return breadcrumbs;
  }

  private getSectionUrl(sectionName: string): string {
    const sectionUrlMap: { [key: string]: string } = {
      'Reports': '/reports/list',
      'Testimonials': '/testimonials/list',
      'Templates': '/templates/list',
      'Earning': '/earnings/list',
      'Appointments': '/appointment/list',
      'Pages': '/posts/list',
      'Coupon': '/coupon/list',
      'Subject': '/subject/list',
      'Category': '/category/list',
      'Grade': '/grade/list',
      'Language': '/language/list',
      'Topic': '/topic/list',
      'Group Class': '/webinar/list',
      'Users': '/users/list',
      'Courses': '/courses/list',
      'Tutors': '/tutor/list',
      'Refund request': '/refunds/refund-list',
      'System Configs': '/config/list',
      'Transaction': '/transactions/transaction',
      'Manage Transaction': '/transactions/transaction'
    };

    return sectionUrlMap[sectionName] || '/dashboard';
  }
}
