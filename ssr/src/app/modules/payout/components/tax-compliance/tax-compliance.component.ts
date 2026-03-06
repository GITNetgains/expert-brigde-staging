import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/services';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-tax-compliance',
  templateUrl: './tax-compliance.component.html'
})
export class TaxComplianceComponent implements OnInit {

  public panNumber = '';
  public panStatus = '';  // 'verified' | 'not_provided' | 'loading' | 'error'
  public panMasked = '';
  public panValid: boolean | null = null;
  public panError = '';
  public saving = false;
  public saveMessage = '';
  public saveSuccess = false;
  public loading = true;
  public serviceUnavailable = false;
  public userMongoId = '';
  public userType = '';
  public countryCode = 'IN';

  private apiBase = '';
  private panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

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
        this.countryCode = user.countryCode || 'IN';
      }
      await this.loadProfile();
    } catch (err) {
      this.loading = false;
      this.serviceUnavailable = true;
    }
  }

  async loadProfile() {
    if (!this.userMongoId) {
      this.loading = false;
      return;
    }

    this.panStatus = 'loading';
    try {
      var url = this.apiBase.replace(/\/v1$/, '') + '/v1/credit/expert-compliance/' + this.userMongoId;
      var resp: any = await this.http.get(url).toPromise();
      if (resp && resp.pan_number_masked) {
        this.panMasked = resp.pan_number_masked;
        this.panStatus = resp.pan_verified ? 'verified' : 'not_provided';
      } else {
        this.panStatus = 'not_provided';
      }
    } catch (err: any) {
      if (err && err.status === 404) {
        this.panStatus = 'not_provided';
      } else {
        this.panStatus = 'error';
        this.serviceUnavailable = true;
      }
    }
    this.loading = false;
  }

  onPanInput() {
    this.panNumber = this.panNumber.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
    this.validatePan();
  }

  validatePan() {
    this.saveMessage = '';
    if (!this.panNumber || this.panNumber.length === 0) {
      this.panValid = null;
      this.panError = '';
      return;
    }
    if (this.panNumber.length < 10) {
      this.panValid = null;
      this.panError = '';
      return;
    }
    if (this.panRegex.test(this.panNumber)) {
      this.panValid = true;
      this.panError = '';
    } else {
      this.panValid = false;
      this.panError = 'Invalid PAN format. Expected: ABCPD1234E (5 letters, 4 digits, 1 letter)';
    }
  }

  async savePan() {
    if (!this.panNumber || !this.panValid) return;

    this.saving = true;
    this.saveMessage = '';

    try {
      var url = this.apiBase.replace(/\/v1$/, '') + '/v1/credit/expert-compliance';
      var payload = {
        expert_mongo_id: this.userMongoId,
        pan_number: this.panNumber,
        residency_country: this.countryCode || 'IN'
      };
      var resp: any = await this.http.post(url, payload).toPromise();
      this.saveSuccess = true;
      this.saveMessage = 'PAN saved successfully';
      this.panMasked = resp.pan_number_masked || this.panNumber.substring(0, 3) + '****' + this.panNumber.substring(9);
      this.panStatus = 'verified';
      this.panNumber = '';
      this.panValid = null;
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
