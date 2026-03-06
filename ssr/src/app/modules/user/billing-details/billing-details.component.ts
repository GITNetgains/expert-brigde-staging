import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/services';
import { environment } from 'src/environments/environment';

interface StateCode {
  state_code: string;
  state_name: string;
  state_type: string;
}

@Component({
  selector: 'app-billing-details',
  templateUrl: './billing-details.component.html'
})
export class BillingDetailsComponent implements OnInit {

  public billingName = '';
  public gstin = '';
  public state = '';
  public stateCode = '';
  public city = '';
  public billingAddress = '';
  public country = 'IN';

  public stateCodes: StateCode[] = [];
  public gstinValid: boolean | null = null;
  public gstinError = '';

  public loading = true;
  public saving = false;
  public saveMessage = '';
  public saveSuccess = false;
  public serviceUnavailable = false;
  public hasExistingProfile = false;
  public existingGstinMasked = '';

  public userMongoId = '';
  public userType = '';

  private apiBase = '';
  private gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.apiBase = (environment as any).apiBaseUrl || 'http://localhost:9000/v1';
  }

  async ngOnInit() {
    try {
      var user = await this.authService.getCurrentUser();
      if (user) {
        this.userMongoId = user._id;
        this.userType = user.type;
        this.country = user.countryCode || 'IN';
      }
      await Promise.all([this.loadStateCodes(), this.loadProfile()]);
    } catch (err) {
      this.loading = false;
      this.serviceUnavailable = true;
    }
  }

  async loadStateCodes() {
    try {
      var url = this.apiBase.replace(/\/v1$/, '') + '/v1/credit/state-codes';
      var resp: any = await this.http.get(url).toPromise();
      if (resp && resp.state_codes) {
        this.stateCodes = resp.state_codes;
      }
    } catch (err) {
      // State codes not critical — user can still save without dropdown
    }
  }

  async loadProfile() {
    if (!this.userMongoId) {
      this.loading = false;
      return;
    }

    try {
      var url = this.apiBase.replace(/\/v1$/, '') + '/v1/credit/client-billing/' + this.userMongoId;
      var resp: any = await this.http.get(url).toPromise();
      if (resp) {
        this.hasExistingProfile = true;
        this.billingName = resp.billing_name || '';
        this.state = resp.state || '';
        this.stateCode = resp.state_code || '';
        this.city = resp.city || '';
        this.billingAddress = resp.billing_address || '';
        this.country = resp.country || 'IN';
        this.existingGstinMasked = resp.gstin_masked || '';
        // Don't pre-fill GSTIN — show masked version instead
      }
    } catch (err: any) {
      if (err && err.status === 404) {
        // No profile yet — that's fine
      } else {
        this.serviceUnavailable = true;
      }
    }
    this.loading = false;
  }

  onGstinInput() {
    this.gstin = this.gstin.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 15);
    this.validateGstin();
  }

  validateGstin() {
    this.saveMessage = '';
    if (!this.gstin || this.gstin.length === 0) {
      this.gstinValid = null;
      this.gstinError = '';
      return;
    }
    if (this.gstin.length < 15) {
      this.gstinValid = null;
      this.gstinError = '';
      return;
    }
    if (this.gstinRegex.test(this.gstin)) {
      this.gstinValid = true;
      this.gstinError = '';
      // Auto-set state code from GSTIN first 2 digits
      var gstinStateCode = this.gstin.substring(0, 2);
      var match = this.stateCodes.find(function(sc) { return sc.state_code === gstinStateCode; });
      if (match) {
        this.stateCode = match.state_code;
        this.state = match.state_name;
      }
    } else {
      this.gstinValid = false;
      this.gstinError = 'Invalid GSTIN format. Expected: 22AAAAA0000A1Z5';
    }
  }

  onStateChange() {
    var match = this.stateCodes.find((sc) => sc.state_code === this.stateCode);
    if (match) {
      this.state = match.state_name;
    }
  }

  async saveBilling() {
    if (this.gstin && !this.gstinValid && this.gstin.length > 0) return;

    this.saving = true;
    this.saveMessage = '';

    try {
      var url = this.apiBase.replace(/\/v1$/, '') + '/v1/credit/client-billing';
      var payload: any = {
        client_mongo_id: this.userMongoId,
        billing_name: this.billingName || null,
        billing_address: this.billingAddress || null,
        state: this.state || null,
        state_code: this.stateCode || null,
        country: this.country || 'IN'
      };
      if (this.gstin && this.gstinValid) {
        payload.gstin = this.gstin;
      }

      var resp: any = await this.http.post(url, payload).toPromise();
      this.saveSuccess = true;
      this.saveMessage = 'Billing details saved successfully';
      this.hasExistingProfile = true;
      if (resp && resp.gstin_masked) {
        this.existingGstinMasked = resp.gstin_masked;
      }
      this.gstin = '';
      this.gstinValid = null;
    } catch (err: any) {
      this.saveSuccess = false;
      if (err && err.error && err.error.detail) {
        this.saveMessage = err.error.detail;
      } else {
        this.saveMessage = 'Failed to save. Please try again.';
      }
    }
    this.saving = false;
  }
}
