import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WorkComponent } from './components/work/word.component';
import { TeachWithUsComponent } from './components/teach/teach.component';
import { PageErrorComponent } from './components/page-error/page-error.component';
import { StaticPageComponent } from './components/static-page/page.component';
import { AiResultComponent } from './components/ai-result/ai-result.component';
import { AuthGuard } from 'src/app/services/guard/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: StaticPageComponent
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
