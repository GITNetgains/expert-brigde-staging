import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WorkComponent } from './components/work/word.component';
import { TeachWithUsComponent } from './components/teach/teach.component';
import { PageErrorComponent } from './components/page-error/page-error.component';
import { StaticPageComponent } from './components/static-page/page.component';
import { AiResultComponent } from './components/ai-result/ai-result.component';
import { AuthGuard } from 'src/app/services/guard/auth.guard';
import { AboutComponent } from './components/about/about.component';
import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { ServicesComponent } from './components/services/services.component';

const routes: Routes = [
  {
    path: '',
    component: StaticPageComponent
  },
  {
    path: 'about',
    component: AboutComponent
  },
  {
    path: 'contact-us',
    component: ContactUsComponent
  },
  {
    path: 'services',
    component: ServicesComponent
  },
  {
    path: 'how-does-it-work',
    component: WorkComponent
  },
  {
    path: 'teach-with-us',
    component: TeachWithUsComponent,
    resolve: {}
  },
  {
    path: 'error/:code',
    component: PageErrorComponent
  },
  {
    path: 'ai-result',
    component: AiResultComponent,
    // canActivate: [AuthGuard]
  },
  {
    path: ':alias',
    component: StaticPageComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PageRoutingModule {}
