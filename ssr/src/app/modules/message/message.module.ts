import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConversationsComponent } from './components/conversations/conversations.component';
import { MessagesComponent } from './components/messages/messages.component';
import { TranslateModule } from '@ngx-translate/core';
import { ConverstionsResolver } from 'src/app/services/resolvers';
import { SharedModule } from 'src/app/shared.module';

const routes: Routes = [
  {
    path: '',
    component: ConversationsComponent,
    resolve: {
      conversations: ConverstionsResolver
    }
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedModule,
    TranslateModule.forChild()
  ],
  declarations: [ConversationsComponent, MessagesComponent],
  exports: [ConversationsComponent, MessagesComponent]
})
export class MessageModule { }
