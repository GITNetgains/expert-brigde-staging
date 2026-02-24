import { NgModule, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PageRoutingModule } from './page.routing';
import { WorkComponent } from './components/work/word.component';
import { TeachWithUsComponent } from './components/teach/teach.component';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { PageErrorComponent } from './components/page-error/page-error.component';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared.module';
import { StaticPageService } from 'src/app/services';
import { StaticPageComponent } from './components/static-page/page.component';
import { AiResultComponent } from './components/ai-result/ai-result.component';
import { HomeModule } from '../home/home.module';
import { FileUploadComponent } from 'src/app/components/media/file-upload/file-upload.component';
import { AiQueryBarComponent } from './components/ai-query-bar/ai-query-bar.component';
import { AboutComponent } from './components/about/about.component';
import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { ExpertParticipationJourneyComponent } from './components/expert-participation-journey/expert-participation-journey.component';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NgbModule,
    PageRoutingModule,
    SlickCarouselModule,
    TranslateModule.forChild(),
    forwardRef(() => SharedModule),
    forwardRef(() => FileUploadComponent)
    , HomeModule
  ],
  declarations: [
    WorkComponent,
    TeachWithUsComponent,
    PageErrorComponent,
    StaticPageComponent,
   AiQueryBarComponent,
    AiResultComponent,
    AboutComponent,
    ContactUsComponent,
    ExpertParticipationJourneyComponent
  ],
  exports: [AiQueryBarComponent],
  entryComponents: [],
  providers: [StaticPageService]
})
export class PageModule {}
