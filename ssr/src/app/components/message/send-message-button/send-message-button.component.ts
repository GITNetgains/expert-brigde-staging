import { Component, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import {
  AppService,
  AuthService,
  ConversationService,
  MessageService
} from 'src/app/services';

@Component({
  templateUrl: './send-message-modal.html'
})
export class MessageMessageModalComponent {
  @Input() conversation: any;
  public message: any = {
    text: ''
  };
  public submitted = false;

  constructor(
    private service: MessageService,
    public activeModal: NgbActiveModal,
    private appService: AppService
  ) {}

  submit(frm: any) {
    this.submitted = true;
    if (frm.invalid) {
      return;
    }

    if (!this.message.text) {
      return this.appService.toastError('Please enter message');
    }

    return this.service
      .send({
        conversationId: this.conversation._id,
        type: 'text',
        text: this.message.text
      })
      .then(() => this.activeModal.close({ success: true }));
  }
}

@Component({
  selector: 'app-send-message-btn',
  template: `<button
    class="btn btn-default btn-block"
    translate
    (click)="sendMessage()"
  >
    <i class="far fa-envelope color-white me-2"></i>
    <span translate>Send a Message</span>
  </button>`
})
export class SendMessageButtonComponent {
  @Input() recipientId: string;
  constructor(
    private appService: AppService,
    private modalService: NgbModal,
    private authService: AuthService,
    private conversationService: ConversationService,
    private router: Router
  ) {}

  sendMessage() {
    if (!this.authService.isLoggedin()) {
      return this.appService.toastError('Please login to send message');
    }
    return this.conversationService
      .create(this.recipientId)
      .then((resp) => {
        const modalRef = this.modalService.open(MessageMessageModalComponent, {
          backdrop: 'static',
          keyboard: false
        });
        modalRef.componentInstance.conversation = resp.data;
        modalRef.result.then((result) => {
          if (result && result.success) {
            this.appService.toastSuccess('Your message has been sent');
            this.router.navigate(['/users/conversations']);
          }
        });
      })
      .catch(() =>
        this.appService.toastError('You can not send messages to yourself')
      );
  }
}
