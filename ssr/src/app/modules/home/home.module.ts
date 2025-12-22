
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeComponent } from './home.component';
import { SearchBarComponent } from 'src/app/components/home/search-bar/search-bar.component';
import { AiSearchComponent } from 'src/app/components/home/ai-search/ai-search.component';
import { HowItWorksComponent } from 'src/app/components/home/how-it-works/how-it-works.component';
import { MakeItHappenComponent } from 'src/app/components/home/make-it-happen/make-it-happen.component';
import { ProcessSectionComponent } from 'src/app/components/home/process-section/process-section.component';
import { BlogSectionComponent } from 'src/app/components/home/blog-section/blog-section.component';
import { PoliciesSectionComponent } from 'src/app/components/home/policies-section/policies-section.component';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { CardCourseComponent } from 'src/app/components/course/card-course/card-course.component';
import { CardWebinarComponent } from 'src/app/components/webinar/card-webinar/card-webinar.component';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { SharedModule } from 'src/app/shared.module';
import { IndustriesCarouselComponent } from 'src/app/components/home/industries-section/industries-section.component';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { register } from 'swiper/element/bundle';
register();
@NgModule({
  declarations: [HomeComponent, SearchBarComponent, AiSearchComponent, HowItWorksComponent, MakeItHappenComponent, ProcessSectionComponent, BlogSectionComponent, PoliciesSectionComponent],
  imports: [
    CommonModule,
    NgbCarouselModule,
    NgbTypeaheadModule,
    FormsModule,
    IndustriesCarouselComponent,
    TranslateModule.forChild(),
    RouterModule,
    CardCourseComponent,
    CardWebinarComponent,
    SlickCarouselModule,
    SharedModule
  ],
  exports: [SearchBarComponent, AiSearchComponent, HowItWorksComponent, MakeItHappenComponent, ProcessSectionComponent, BlogSectionComponent, PoliciesSectionComponent],
 schemas: [CUSTOM_ELEMENTS_SCHEMA] 
})
export class HomeModule { }
