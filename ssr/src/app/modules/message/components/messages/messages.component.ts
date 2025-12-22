import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  ViewChildren,
  QueryList,
  OnDestroy,
  Output,
  EventEmitter,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { Subscription } from 'rxjs';
// import { PusherService } from '../../services/pusher.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import {
  ConversationService,
  MessageService,
  STATE,
  SocketService,
  StateService
} from 'src/app/services';
import { isPlatformBrowser } from '@angular/common';
// import { SocketService } from '../../services/socket.service';
@Component({
  selector: 'app-messages',
  templateUrl: './messages.html'
})
export class MessagesComponent implements OnInit, OnDestroy {
  @Input() conversation: any;
  public items: any = [];
  public page: any = 1;
  public pageSize: any = 10;
  public total = 0;
  public currentUser: any = {};
  public newText: any = '';
  public receiver: any = null;
  private conversationSubscription: Subscription;
  public loading = false;
  @ViewChild('commentEl') comment: ElementRef;
  scrolltop = 0;
  @ViewChildren('item') itemElements: QueryList<any>;
  @Output() doBack = new EventEmitter();
  constructor(
    private service: MessageService,
    private conversationService: ConversationService,
    private toasty: ToastrService,
    private translate: TranslateService,
    private socket: SocketService,
    private stateService: StateService,
    @Inject(PLATFORM_ID) private platformId: any // private socket: Socket
  ) {
    this.currentUser = this.stateService.getState(STATE.CURRENT_USER);
    this.conversationSubscription =
      this.conversationService.conversationLoaded$.subscribe((data) => {
        if (this.conversation && this.conversation._id === data._id) {
          return;
        }
        this.conversation = data;
        this.items = [];
        this.page = 1;
        this.query();
      });
  }

  ngOnInit() {
    if (this.conversation) {
      this.query();
    }
    if (isPlatformBrowser(this.platformId)) {
      this.socket.on('new_message', this.getMessage.bind(this));
    }
  }

  getMessage(msg: any) {
    if (this.conversation._id === msg.conversationId) {
      this.items = [...this.items, msg];
    }
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    this.conversationSubscription.unsubscribe();
    this.socket.off('new_message', this.getMessage.bind(this));
  }

  query() {
    this.loading = true;
    this.service
      .listByConversation(this.conversation._id, {
        page: this.page,
        take: this.pageSize
      })
      .then((resp) => {
        this.total = resp.data.count;
        this.items = resp.data.items.reverse().concat(this.items);
        this.loading = false;
        const receivers = (this.conversation.members || []).filter(
          (m: any) => m._id !== this.currentUser._id
        );
        this.receiver = receivers && receivers.length ? receivers[0] : null;
        // this.scrolltop = this.comment.nativeElement.scrollHeight;
        this.itemElements.changes.subscribe(() => this.onItemElementsChanged());
      });
  }

  private onItemElementsChanged(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    this.comment.nativeElement.scroll({
      top: this.comment.nativeElement.scrollHeight,
      left: 0,
      behavior: 'smooth'
    });
  }

  loadMore() {
    this.loading = true;
    this.page++;
    this.service
      .listByConversation(this.conversation._id, {
        page: this.page,
        take: this.pageSize
      })
      .then((resp) => {
        this.total = resp.data.count;
        this.items = resp.data.items.reverse().concat(this.items);
        $('.msg_history').animate({ scrollTop: 0 }, 500);
        this.loading = false;
      });
  }

  send() {
    if (!this.newText) {
      return this.toasty.error(this.translate.instant('Please enter message'));
    }

    this.service
      .send({
        text: this.newText,
        type: 'text',
        conversationId: this.conversation._id
      })
      .then((resp) => {
        this.items.push(resp.data);
        this.service.afterSendSuccess(this.conversation._id, resp.data);
        this.newText = '';
        this.scrolltop = this.comment.nativeElement.scrollHeight;
      });
  }

  public enterToSend(event: any) {
    if (event.charCode === 13) {
      this.send();
    }
  }

  public goBack() {
    this.doBack.emit(true);
  }
}
