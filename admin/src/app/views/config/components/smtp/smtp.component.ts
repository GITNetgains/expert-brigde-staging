import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ButtonDirective,
  ColComponent,
  ContainerComponent,
  FormCheckComponent,
  FormCheckInputDirective,
  FormCheckLabelDirective,
  FormControlDirective,
  FormLabelDirective,
  FormSelectDirective,
  InputGroupComponent,
  RowComponent,
  TableDirective,
} from '@coreui/angular';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-smtp',
  standalone: true,
  templateUrl: './smtp.component.html',
  imports: [
    ContainerComponent,
    RowComponent,
    ColComponent,
    TableDirective,
    FormSelectDirective,
    ButtonDirective,
    FormCheckComponent,
    FormCheckInputDirective,
    FormCheckLabelDirective,
    FormsModule,
    FormControlDirective,
    FormLabelDirective,
    InputGroupComponent,
  ],
})
export class SmtpComponent {
  @Input() items: any[] = [];
  @Input() save!: (item: any) => Observable<void>;

  smtpServices: string[] = [
    '123',
    '163',
    '1und1',
    'AOL',
    'DebugMail',
    'DynectEmail',
    'FastMail',
    'GandiMail',
    'Gmail',
    'Godaddy',
    'GodaddyAsia',
    'GodaddyEurope',
    'hot.ee',
    'Hotmail',
    'iCloud',
    'mail.ee',
    'Mail.ru',
    'Maildev',
    'Mailgun',
    'Mailjet',
    'Mailosaur',
    'Mandrill',
    'Naver',
    'OpenMailBox',
    'Outlook365',
    'Postmark',
    'QQ',
    'QQex',
    'SendCloud',
    'SendGrid',
    'SendinBlue',
    'SendPulse',
    'SES',
    'SES-US-EAST-1',
    'SES-US-WEST-2',
    'SES-EU-WEST-1',
    'Sparkpost',
    'Yahoo',
    'Yandex',
    'Zoho',
    'qiye.aliyun',
  ];

  onSave(item: any) {
    if (this.save) {
      this.save(item).subscribe();
    }
  }
}
