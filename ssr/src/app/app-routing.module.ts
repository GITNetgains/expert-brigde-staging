import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// import { HomeComponent } from './modules/general/home/home.component';
import { NotFoundComponent } from './modules/general/not-found/not-found.component';
import { HomeComponent } from './modules/home/home.component';
import { FullComponent } from './layouts/full/full.component';
import categoriesResolver from './services/resolvers/category.resolver';
import { BlankComponent } from './layouts/blank/blank.component';
import { CustomPreLoadingStrategyService } from './pre-loading-strategy.service';
import { DashboardLayoutComponent } from './layouts/dashboard/dashboard.component';
import subjectsResolver from './services/resolvers/subject.resolver';
import { AuthGuard } from './services/guard/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    children: [{ path: '', component: HomeComponent, pathMatch: 'full' }],
    resolve: {
      categories: categoriesResolver
    }
  },
 
   {
    path: 'home',
    component: FullComponent,
    children: [{ path: '', component: HomeComponent, pathMatch: 'full' }],
    resolve: {
      categories: categoriesResolver
    }
  },
  {
    path: 'auth',
    component: BlankComponent,
    loadChildren: () =>
      import('./modules/auth/auth.module').then((mod) => mod.AuthModule)
  },
  {
    path: 'experts',
    component: FullComponent,
    data: { preload: true, loadAfter: 0 },
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/tutor/tutor.module').then((mod) => mod.TutorModule),
    resolve: { categories: categoriesResolver }
  },
  {
    path: 'courses',
    component: FullComponent,
    // data: { preload: true, loadAfter: 0 },
    loadChildren: () =>
      import('./modules/course/course.module').then((mod) => mod.CourseModule),
    resolve: { categories: categoriesResolver }
  },
  {
    path: 'groupclass',
    component: FullComponent,
    data: { preload: true, loadAfter: 0 },
    loadChildren: () =>
      import('./modules/webinar/webinar.module').then(
        (mod) => mod.WebinarModule
      ),
    resolve: { categories: categoriesResolver }
  },
  {
    path: 'payments',
    component: FullComponent,
    loadChildren: () =>
      import('./modules/payment/payment.module').then((m) => m.PaymentModule),
    resolve: {}
  },
  {
    path: 'pages',
    component: FullComponent,
    loadChildren: () =>
      import('./modules/page/page.module').then((m) => m.PageModule),
    resolve: {}
  },
  {
    path: 'blogs',
    component: FullComponent,
    loadChildren: () =>
      import('./modules/page/page.module').then((m) => m.PageModule),
    resolve: {}
  },
  {
    path: 'industries',
    component: FullComponent,
    loadChildren: () =>
      import('./modules/page/page.module').then((m) => m.PageModule),
    resolve: {}
  },
  {
    path: 'users',
    component: DashboardLayoutComponent,
    data: { preload: true, loadAfter: 0 },
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        data: { preload: true, loadAfter: 0 },
        loadChildren: () =>
          import('./modules/user/user.module').then((mod) => mod.UserModule)
      },
      {
        path: 'payout',
        data: { preload: true, loadAfter: 0 },
        loadChildren: () =>
          import('./modules/payout/payout.module').then((m) => m.PayoutModule),
        resolve: {}
      },
      {
        path: 'refund',
        loadChildren: () =>
          import('./modules/refund/refund.module').then((m) => m.RefundModule),
        resolve: {}
      },
      {
        path: 'transaction',
        data: { preload: true, loadAfter: 0 },
        loadChildren: () =>
          import('./modules/transactions/transaction.module').then(
            (m) => m.TransactionModule
          ),
        resolve: {}
      },
      {
        path: 'conversations',
        data: { preload: true, loadAfter: 0 },
        loadChildren: () =>
          import('./modules/message/message.module').then(
            (m) => m.MessageModule
          )
      }
    ],
    resolve: {
      categories: categoriesResolver,
      subjects: subjectsResolver
    }
  },
  {
    path: 'categories',
    component: FullComponent,
    loadChildren: () =>
      import('./modules/category/category.module').then(
        (mod) => mod.CategoryModule
      ),
    resolve: { categories: categoriesResolver }
  },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: false,
      anchorScrolling: 'enabled',
      scrollPositionRestoration: 'enabled',
      initialNavigation: 'enabledBlocking',
      preloadingStrategy: CustomPreLoadingStrategyService
    })
  ],
  exports: [RouterModule],
  declarations: []
})
export class AppRoutingModule {}
