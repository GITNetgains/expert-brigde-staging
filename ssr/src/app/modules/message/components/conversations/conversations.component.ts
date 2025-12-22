import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// import { PusherService } from '../../services/pusher.service';
import { orderBy } from 'lodash';
import { Subscription } from 'rxjs';
import { ConversationService, MessageService, STATE, SeoService, SocketService, StateService, FavoriteService, TutorService } from 'src/app/services';

@Component({
  templateUrl: './conversations.html'
})
export class ConversationsComponent implements OnDestroy {
  public originalConversations: any = [];
  public conversations: any = [];
  private currentUser: any;
  public activeConversation: any;
  public q: any = '';
  private sendMessageSubscription: Subscription;
  public show = false;
  public contacts: any = [];
  constructor(
    private route: ActivatedRoute,
    private service: ConversationService,
    private socket: SocketService,
    private seoService: SeoService,
    private messageService: MessageService,
    private stateService: StateService,
    private favoriteService: FavoriteService,
    private tutorService: TutorService
  ) {
    this.seoService.setMetaTitle('Messages');
    this.socket.reconnect();
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
    this.conversations = this.mapConversationName(route.snapshot.data.conversations);
    this.originalConversations = this.conversations;
    this.socket.getMessage(this.getMessage.bind(this));
    this.sendMessageSubscription = this.messageService.sendMessage$.subscribe(data => {
      const { conversationId, message } = data;
      if (conversationId && message) {
        const conversation = this.conversations.find((item: any) => item._id.toString() === conversationId.toString());
        if (conversation) {
          conversation.lastMessage = message;
          conversation.updatedAt = message.createdAt;
          this.conversations = orderBy(this.conversations, ['updatedAt'], ['desc']);
        }
      }
    });

    if (!this.conversations || this.conversations.length === 0) {
      this.loadContacts();
    }
  }

  getMessage(msg: any) {
    if (this.activeConversation && this.activeConversation._id === msg.conversationId) {
      this.activeConversation.lastMessage = msg;
      this.activeConversation.updatedAt = msg.createdAt;
      this.conversations = orderBy(this.conversations, ['updatedAt'], ['desc']);
      return;
    } else {
      const conversation = this.conversations.find((item: any) => item._id.toString() === msg.conversationId);
      if (conversation) {
        conversation.userMeta.unreadMessage += 1;
        conversation.lastMessage = msg;
        conversation.updatedAt = msg.createdAt;
        this.conversations = orderBy(this.conversations, ['updatedAt'], ['desc']);
      } else {
        this.service.findOne(msg.conversationId).then(resp => {
          if (resp.data) {
            resp.data.lastMessage = msg;
            const newConversation = this.mapConversationName([resp.data]);
            this.conversations = newConversation.concat(this.conversations);
            this.conversations = orderBy(this.conversations, ['updatedAt'], ['desc']);
          }
        });
      }
    }
  }

  mapConversationName(conversations: any = []) {
    return conversations.map((conversation: any) => {
      const member = (conversation.members || []).filter((m: any) => m._id && m._id !== this.currentUser._id);
      conversation.name = member.length ? member[0].name : this.currentUser.name;
      conversation.member = member.length ? member[0] : this.currentUser;
      return conversation;
    });
  }

  selectConversation(conversation: any) {
    this.activeConversation = conversation;
    this.service.setActive(conversation);
    this.show = true;
    if (conversation && conversation.userMeta && conversation.userMeta.unreadMessage > 0) {
      this.service
        .read(conversation._id, { all: true })
        .then(resp => {
          if (resp && resp.data && resp.data.success) {
            conversation.userMeta.unreadMessage = 0;
          }
        })
        .catch(err => console.log(err));
    }
  }

  filter() {
    this.conversations = this.originalConversations.filter(
      (conversation: any) => conversation.name.toLowerCase().indexOf(this.q) > -1
    );
  }

  enterToSend(event: any) {
    if (event.charCode === 13) {
      this.filter();
    }
  }

  substringMessage(text: string) {
    if (text && text.length > 55) {
      return text.substring(0, 55) + '...';
    }
    return text;
  }

  ngOnDestroy() {
    // this.socket.disconnect();
    // return;
    this.socket.off('new_message', this.getMessage.bind(this))
  }

  onBack() {
    this.show = false;
  }

  async loadContacts() {
    try {
      const fav = await this.favoriteService.search({ take: 20, sort: 'createdAt', sortType: 'desc' }, 'tutor');
      this.contacts = fav?.data?.items || [];
      if (!this.contacts.length) {
        const t = await this.tutorService.search({ page: 0, take: 10, sort: 'createdAt', sortType: 'desc', isHomePage: true });
        this.contacts = t?.data?.items || [];
      }
    } catch (e) {
      this.contacts = [];
    }
  }

  async startConversation(recipientId: string) {
    try {
      const resp = await this.service.create(recipientId);
      const conv = this.mapConversationName([resp.data])[0];
      this.conversations = [conv].concat(this.conversations);
      this.originalConversations = this.conversations;
      this.selectConversation(conv);
    } catch (e) { return }
  }

}
