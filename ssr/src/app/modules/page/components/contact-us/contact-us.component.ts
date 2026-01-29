import { Component } from '@angular/core';
import { SeoService } from 'src/app/services';
import { ContactService } from 'src/app/services/contact.service';
import { AppService } from 'src/app/services/';

declare const grecaptcha: any;

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent {
  loading = false;

  model: any = {
    name: '',
    companyName: '',
    email: '',
    phoneNumber: '',
    message: '',
    recaptchaToken: ''
  };

  constructor(
    private seoService: SeoService,
    private contactService: ContactService,
    private appService: AppService
  ) {
    this.seoService.setMetaTitle('Contact Us');
    this.seoService.setMetaDescription(
      'Get in touch with Expert Bridge for support or inquiries.'
    );
  }

  submit() {
    if (this.loading) return;

    this.loading = true;

    grecaptcha
      .execute('6Lce7CQsAAAAAAI1CTK6C6AfG7GQjd3IsC_qS08n', { action: 'contact_us' })
      .then((token: string) => {
        this.model.recaptchaToken = token;

        this.contactService.submit(this.model)
          .then(() => {
            this.loading = false;

            this.appService.toastSuccess(
              'Thank you! Your message has been sent successfully.'
            );

            this.model = {
              name: '',
              companyName: '',
              email: '',
              phoneNumber: '',
              message: '',
              recaptchaToken: ''
            };
          })
          .catch((err) => {
            this.loading = false;

            this.appService.toastError(
              err?.message || 'Something went wrong. Please try again.'
            );
          });
      })
      .catch(() => {
        this.loading = false;
        this.appService.toastError('reCAPTCHA verification failed.');
      });
  }
}
