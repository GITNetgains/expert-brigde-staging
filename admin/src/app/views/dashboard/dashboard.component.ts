import { Component, OnInit, OnDestroy } from '@angular/core';
import { firstPageService } from '../../../services/firstPage.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { StatItem } from '../../../interfaces/dashboard.interface';
import { 
  cilSchool, 
  cilPeople, 
  cilUserUnfollow, 
  cilUserX, 
  cilGlobeAlt, 
  cilCalendar, 
  cilBook, 
  cilCreditCard,
  cilLanguage,
  cilContact
} from '@coreui/icons';

import {
  RowComponent,
  ColComponent,
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { RouterLink } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';

@Component({
  selector: 'app-first-page',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    RowComponent,
    ColComponent,
    RouterLink,
    IconDirective,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  subtitle: string = 'Quick analytics';
  config: any;
  loading = false;

  private statsSubscription: Subscription | null = null;

  icons = {
    cilSchool,
    cilPeople,
    cilUserUnfollow,
    cilUserX,
    cilGlobeAlt,
    cilCalendar,
    cilBook,
    cilCreditCard,
    cilLanguage,
    cilContact
  };

  public start: Record<string, StatItem> = {
    totalStudents: {
      title: 'Clients registered',
      icon: 'cilSchool',
      color: 'primary',
      path: '/users/list',
    },
    totalTutors: {
      title: 'Experts registered',
      icon: 'cilPeople',
      color: 'info',
      path: '/tutor/list',
    },
    totalTutorPendingApproved: {
      title: 'Experts pending for approval',
      icon: 'cilPeople',
      color: 'warning',
      path: '/tutor/list',
    },
    totalTutorApproved: {
      title: 'Experts approved',
      icon: 'cilPeople',
      color: 'danger',
      path: '/tutor/list',
    },
    totalTutorActive: {
      title: 'Expert activated',
      icon: 'cilPeople',
      color: 'primary',
      path: '/tutor/list',
    },
    totalTutorInActive: {
      title: 'Expert inactivated',
      icon: 'cilUserUnfollow',
      color: 'info',
      path: '/tutor/list',
    },
    totalTutorRejected: {
      title: 'Experts rejected',
      icon: 'cilUserX',
      color: 'warning',
      path: '/tutor/list',
    },
    totalLanguages: {
      title: 'Languages',
      icon: 'cilLanguage',
      color: 'danger',
      path: '/language/list',
    },
    totalAppointments: {
      title: 'Appointments on the platform',
      icon: 'cilCalendar',
      color: 'primary',
      path: '/appointment/list',
    },
    totalWebinars: {
      title: 'Group Classes',
      icon: 'cilContact',
      color: 'info',
      path: '/webinar/list',
    },
    totalCourses: {
      title: 'Courses',
      icon: 'cilBook',
      color: 'warning',
      path: '/courses/list',
    },
    totalCoursesPendingForApproval: {
      title: 'Courses pending for approval',
      icon: 'cilBook',
      color: 'danger',
      path: '/courses/list',
    },
    totalRevenue: {
      title: 'Commission',
      icon: 'cilCreditCard',
      color: 'primary',
      path: '/earnings/list',
    },
    payoutRequestPending: {
      title: 'Payout request pending',
      icon: 'cilCreditCard',
      color: 'info',
      path: '/payout/request',
    },
    totalPendingRefundRequest: {
      title: 'Refund requests pending',
      icon: 'cilCreditCard',
      color: 'warning',
      path: '/refund/refund-list',
    },
  };

  public starts: Array<{
    title: string;
    color: string;
    value: number;
    icon: string;
    path: string;
  }> = [];
  constructor(
    private starterService: firstPageService,
    private route: ActivatedRoute
  ) {
    this.config = this.route.snapshot.data['appConfig'];
  }

  ngOnInit() {
    this.loading = true;
    this.statsSubscription = this.starterService.stats().subscribe({
      next: (resp) => {
        const { data } = resp;
        this.starts = Object.keys(this.start).map((key) => {
          return {
            ...this.start[key],
            value: data[key] ?? 0,
          };
        });

        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
      },
    });
  }

  ngOnDestroy() {
    this.statsSubscription?.unsubscribe();
  }
}
