import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ITutorCertificate } from 'src/app/interface';
@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.html',
  standalone: true,
  imports: [CommonModule]
})
export class CertificateComponent {
  @Input() certificate: ITutorCertificate;
}
