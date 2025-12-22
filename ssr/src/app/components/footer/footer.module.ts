import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FooterRoutingModule } from './footer-routing.module';
import { FooterComponent } from './footer.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [FooterComponent],
  imports: [CommonModule, FooterRoutingModule, TranslateModule.forChild()],
  exports: [FooterComponent]
})
export class FooterModule {}
