import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-invoice-upload',
  templateUrl: './invoice-upload.component.html',
  styleUrls: ['./invoice-upload.component.scss']
})
export class InvoiceUploadComponent implements OnInit, OnChanges {
  @Input() expertId: string = '';
  @Input() isGstRegistered: boolean = false;

  selectedFile: File | null = null;
  invoiceNumber: string = '';
  invoiceDate: string = '';
  invoiceAmount: string = '';
  uploading: boolean = false;
  uploadedInvoices: any[] = [];
  loadingInvoices: boolean = false;

  private apiBase = '';

  constructor(
    private http: HttpClient,
    private toastr: ToastrService
  ) {
    this.apiBase = (environment as any).apiBaseUrl || '/v1';
  }

  ngOnInit(): void {
    if (this.isGstRegistered && this.expertId) {
      this.loadInvoices();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['expertId'] || changes['isGstRegistered']) && this.isGstRegistered && this.expertId) {
      this.loadInvoices();
    }
  }

  loadInvoices(): void {
    if (!this.expertId) return;
    this.loadingInvoices = true;
    var url = this.apiBase.replace(/\/v1$/, '') + '/v1/credit/experts/payout-invoice/by-expert/' + this.expertId;
    this.http.get(url).subscribe({
      next: (res: any) => {
        this.uploadedInvoices = res.invoices || [];
        this.loadingInvoices = false;
      },
      error: () => {
        this.loadingInvoices = false;
      }
    });
  }

  onFileSelected(event: any): void {
    var file = event.target.files[0];
    if (file) {
      var allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        this.toastr.error('Only PDF, JPEG, PNG files allowed');
        event.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.error('File size must be less than 5MB');
        event.target.value = '';
        return;
      }
      this.selectedFile = file;
    }
  }

  uploadInvoice(): void {
    if (!this.selectedFile || !this.invoiceNumber || !this.invoiceDate) {
      this.toastr.warning('Please fill all required fields');
      return;
    }

    this.uploading = true;
    var formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('expert_mongo_id', this.expertId);
    formData.append('invoice_number', this.invoiceNumber);
    formData.append('invoice_date', this.invoiceDate);
    if (this.invoiceAmount) {
      formData.append('invoice_amount', this.invoiceAmount);
    }

    var url = this.apiBase.replace(/\/v1$/, '') + '/v1/credit/experts/payout-invoice/upload';
    this.http.post(url, formData).subscribe({
      next: (res: any) => {
        this.toastr.success('Invoice uploaded successfully');
        this.selectedFile = null;
        this.invoiceNumber = '';
        this.invoiceDate = '';
        this.invoiceAmount = '';
        this.uploading = false;
        this.loadInvoices();
      },
      error: (err) => {
        var msg = err.error?.detail || err.error?.error || 'Failed to upload invoice';
        this.toastr.error(msg);
        this.uploading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'verified': return 'badge-success';
      case 'rejected': return 'badge-danger';
      default: return 'badge-warning';
    }
  }
}
