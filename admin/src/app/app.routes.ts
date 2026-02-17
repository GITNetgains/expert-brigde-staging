import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './layout';
import { authGuard } from '../guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    component: DefaultLayoutComponent,
    data: {
      title: 'Home',
    },
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./views/dashboard/routes').then((m) => m.routes),
      },
      {
        path: 'appointment',
        loadChildren: () =>
          import('./views/appointment/appointment.routing').then(
            (m) => m.routes
          ),
      },
      {
        path: 'grade',
        loadChildren: () =>
          import('./views/grade/routes').then((m) => m.routes),
      },
      {
        path: 'category',
        loadChildren: () =>
          import('./views/category/routes').then((m) => m.routes),
      },
      {
        path: 'subject',
        loadChildren: () =>
          import('./views/subject/routes').then((m) => m.routes),
      },
      {
        path: 'topic',
        loadChildren: () =>
          import('./views/topic/routes').then((m) => m.routes),
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./views/user/user.routes').then((m) => m.routes),
      },
      {
        path: 'tutor',
        loadChildren: () =>
          import('./views/tutor/tutor.routes').then((m) => m.routes),
      },
      {
        path: 'posts',
        loadChildren: () =>
          import('./views/post/post.routing').then((m) => m.routes),
      },
      // {
      //   path: 'courses',
      //   loadChildren: () =>
      //     import('./views/course/course.routes').then((m) => m.routes),
      // },
      {
        path: 'test',
        loadComponent: () =>
          import('./views/test/test.component').then((m) => m.TestComponent),
      },
      {
        path: 'refund',
        loadChildren: () =>
          import('./views/refund/refund.routing').then((m) => m.routes),
      },
      {
        path: 'coupon',
        loadChildren: () =>
          import('./views/coupon/routes').then((m) => m.routes),
      },
      {
        path: 'payment',
        loadChildren: () =>
          import('./views/transaction/transaction.routing').then(
            (m) => m.routes
          ),
      },
      {
        path: 'payout',
        loadChildren: () =>
          import('./views/payout/payout.routes').then((m) => m.routes),
      },
      {
        path: 'config',
        loadChildren: () =>
          import('./views/config/config.routing').then((m) => m.routes),
      },
      {
        path: 'templates',
        loadChildren: () =>
          import('./views/email-template/template.routing').then(
            (m) => m.routes
          ),
      },
      {
        path: 'testimonials',
        loadChildren: () =>
          import('./views/testimonial/testimonial.routing').then(
            (m) => m.routes
          ),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./views/report/route').then((m) => m.routes),
      },
      {
        path: 'earnings',
        loadChildren: () =>
          import('./views/earning-stats/earning.routing').then((m) => m.routes),
      },
      {
        path: 'webinar',
        loadChildren: () =>
          import('./views/webinar/webinar.routes').then((m) => m.routes),
      },
      {
        path: 'language',
        loadChildren: () =>
          import('./views/i18n/language.routing').then((m) => m.routes),
      },
      {
        path: 'contacts',
        loadChildren: () =>
          import('./views/contact/contact.routing').then((m) => m.routes),
      },
    ],
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./views/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
    data: {
      title: 'Login Page',
    },
  },
  {
    path: 'forgot',
    loadComponent: () =>
      import('./views/auth/forgot/forgot.component').then(
        (m) => m.ForgotComponent
      ),
    data: {
      title: 'Forgot Password',
    },
  },

  { path: '**', redirectTo: 'dashboard' },
];
