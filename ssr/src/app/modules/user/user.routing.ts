import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfileUpdateComponent } from './profile/profile-update.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MyCategoriesComponent } from './my-category';
import categoriesResolver from 'src/app/services/resolvers/category.resolver';
import { ScheduleComponent } from './schedule/schedule.component';
import { ListNotificationComponent } from './notifications/list.component';
import { ListMyCourseComponent } from './my-course/list/list.component';
import { MyCourseDetailComponent } from './my-course/detail/detail.component';
import { CouponListComponent } from './coupon/list/list.component';
import { CouponFormComponent } from './coupon/form/form.component';
import { CourseCreateComponent, CourseListingComponent, CourseUpdateComponent } from './course';
import {
  WebinarListingComponent,
  WebinarCreateComponent,
  WebinarUpdateComponent
} from './webinar';
import { FavoriteComponent } from './favorite/favorite.component';
import { LessonDetailComponent } from './my-lesson/detail/detail.component';
import { ListLessonComponent } from './my-lesson/list/list.component';
import { ScheduleDetailComponent } from './my-schedule/detail/detail.component';
import { ListScheduleComponent } from './my-schedule/list/list.component';
import { LessonSpaceComponent } from './lesson-space/lesson-space.component';
import { AiQueryListComponent } from './ai-queries/list/list.component';
import { BrowseGroupSessionsComponent } from './browse-group-sessions/browse-group-sessions.component';

const routes: Routes = [
  {
    path: 'profile',
    component: ProfileUpdateComponent,
    resolve: {}
  },
  {
    path: 'ai-queries',
    component: AiQueryListComponent,
    resolve: {}
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    resolve: {}
  },
  {
    path: 'my-categories',
    component: MyCategoriesComponent,
    resolve: {
      categories: categoriesResolver
    }
  },
  {
    path: '1on1sessions',
    component: ScheduleComponent
  },
  {
    path: 'notifications',
    component: ListNotificationComponent
  },
  {
    path: 'my-courses',
    component: ListMyCourseComponent,
    resolve: {
      categories: categoriesResolver
    }
  },
  {
    path: 'my-courses/:id',
    component: MyCourseDetailComponent,
    resolve: {}
  },
  {
    path: 'coupons',
    component: CouponListComponent
  },
  {
    path: 'coupons/form',
    component: CouponFormComponent
  },
  {
    path: 'coupons/form/:id',
    component: CouponFormComponent
  },
  {
    path: 'courses/create',
    component: CourseCreateComponent,
    resolve: {}
  },
  {
    path: 'courses',
    component: CourseListingComponent,
    resolve: {
      categories: categoriesResolver
    }
  },
  {
    path: 'courses/:id',
    component: CourseUpdateComponent,
    resolve: {}
  },
  {
    path: 'browse-group-sessions',
    component: BrowseGroupSessionsComponent,
    resolve: {
      categories: categoriesResolver
    }
  },
  { path: 'groupclass', redirectTo: 'groupsession', pathMatch: 'full' },
  { path: 'groupclass/create', redirectTo: 'groupsession/create', pathMatch: 'full' },
  { path: 'groupclass/:id', redirectTo: 'groupsession/:id', pathMatch: 'full' },
  { path: '1on1classes', redirectTo: '1on1sessions', pathMatch: 'full' },
  {
    path: 'groupsession',
    component: WebinarListingComponent
  },
  {
    path: 'groupsession/create',
    component: WebinarCreateComponent
  },
  {
    path: 'groupsession/:id',
    component: WebinarUpdateComponent
  },
  {
    path: 'favorites/:type',
    component: FavoriteComponent
  },
  {
    path: 'appointments',
    component: ListScheduleComponent,
    resolve: {}
  },
  {
    path: 'appointments/:id',
    component: ScheduleDetailComponent,
    resolve: {}
  },
  {
    path: 'lessons',
    component: ListLessonComponent,
    resolve: {}
  },
  {
    path: 'lessons/:id',
    component: LessonDetailComponent,
    resolve: {}
  },
  {
    path: 'lesson-space',
    component: LessonSpaceComponent,
    resolve: {},
    data: {
      noShowMenu: true
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
