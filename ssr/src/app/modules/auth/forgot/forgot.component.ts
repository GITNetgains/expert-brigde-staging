import { AfterViewInit, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppService, AuthService, STATE, StateService } from 'src/app/services';

@Component({
  templateUrl: 'forgot.component.html',
  styleUrls: ['./forgot.component.scss']
})
export class ForgotComponent implements AfterViewInit {
  private Auth: AuthService;
  public credentials = {
    email: ''
  };
  public submitted: Boolean = false;
  public appConfig: any;

  constructor(
    auth: AuthService,
    public router: Router,
    public stateService: StateService,
    private appService: AppService
  ) {
    this.Auth = auth;
    this.appConfig = this.stateService.getState(STATE.CONFIG);
  }

  login(frm: any) {
    this.submitted = true;
    if (frm.invalid) {
      return;
    }

    this.Auth.forgot(this.credentials.email.toLowerCase())
      .then(() => {
        this.appService.toastSuccess('An email was sent to your address');
        this.router.navigate(['/auth/login']);
      })
      .catch((e) => this.appService.toastError(e));
  }

  ngAfterViewInit() {
    const target = document.getElementById('email-input') as any;
    target.addEventListener(
      'paste',
      (event: any) => {
        event.preventDefault();
        const clipboard = event.clipboardData,
          text = clipboard.getData('Text');
        event.target.value = text.trim();
        this.credentials.email = text.trim();
      },
      false
    );
  }
}
