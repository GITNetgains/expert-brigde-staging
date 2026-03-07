import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/services';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-payment-success',
  templateUrl: './success.html',
  styleUrls: ['./success.component.scss']
})
export class PaymentSuccessComponent implements OnInit, OnDestroy {
  public second: any = 0;
  public interval: any;
  public showBillingPrompt = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.second = 5;
    this.interval = window.setInterval(() => {
      if (this.second > 0) {
        this.second = this.second - 1;
      } else {
        window.clearInterval(this.interval);
        if (!this.showBillingPrompt) {
          this.router.navigate(['/users/transaction']);
        }
      }
    }, 1000);

    this.checkBillingProfile();
  }

  async checkBillingProfile() {
    try {
      var user = await this.authService.getCurrentUser();
      if (!user || !user._id) return;

      var url = environment.url + '/v1/credit/client-billing/' + user._id;
      this.http.get(url).subscribe(
        (res: any) => {
          if (res && res.gstin) {
            this.showBillingPrompt = false;
          } else {
            this.showBillingPrompt = true;
            window.clearInterval(this.interval);
          }
        },
        () => {
          this.showBillingPrompt = true;
          window.clearInterval(this.interval);
        }
      );
    } catch (e) {
      // SSR guard — do nothing on server
    }
  }

  dismissBillingPrompt() {
    this.showBillingPrompt = false;
    this.router.navigate(['/users/transaction']);
  }

  ngOnDestroy() {
    window.clearInterval(this.interval);
  }
}
