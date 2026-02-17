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

    const validationError = this.getValidationError();
    if (validationError) {
      this.appService.toastError(validationError);
      return;
    }

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
            this.appService.toastError(this.getErrorMessage(err));
          });
      })
      .catch(() => {
        this.loading = false;
        this.appService.toastError('reCAPTCHA verification failed. Please try again.');
      });
  }

  private getValidationError(): string | null {
    const name = (this.model.name || '').trim();
    const companyName = (this.model.companyName || '').trim();
    const email = (this.model.email || '').trim();
    const phoneNumber = (this.model.phoneNumber || '').trim();
    const message = (this.model.message || '').trim();

    if (!name) return 'Please enter your name.';
    if (!companyName) return 'Please enter your company name.';
    if (!email) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
    if (!phoneNumber) return 'Please enter your phone number.';
    if (!message) return 'Please enter your message.';
    if (message.length < 5) return 'Your message must be at least 5 characters long.';

    return null;
  }

  private getErrorMessage(err: any): string {
    if (!err) return 'Something went wrong. Please try again.';
    if (typeof err === 'string') return err;

    const data = err.data || err.error?.data;
    if (data?.details && Array.isArray(data.details) && data.details.length > 0) {
      const first = data.details[0];
      const msg = first.message || '';
      if (msg.includes('message') && msg.includes('5')) return 'Your message must be at least 5 characters long.';
      if (msg.includes('name')) return 'Please enter a valid name.';
      if (msg.includes('companyName')) return 'Please enter your company name.';
      if (msg.includes('email')) return 'Please enter a valid email address.';
      if (msg.includes('phoneNumber')) return 'Please enter your phone number.';
      return first.message || err.message || 'Please check your form and try again.';
    }

    const message = err.message || err.error?.message || data?.message;
    if (message && message !== 'ERR_VALIDATE_ERROR') return message;

    return 'Please check your form and try again.';
  }
}
