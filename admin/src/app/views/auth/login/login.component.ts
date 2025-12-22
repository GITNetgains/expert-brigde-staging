import { Component, inject, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconDirective } from '@coreui/icons-angular';
import { ContainerComponent, RowComponent, ColComponent, CardGroupComponent, TextColorDirective, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, FormControlDirective, ButtonDirective, FormFeedbackComponent, ToasterPlacement, ToasterComponent } from '@coreui/angular';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../services';
import { Router, RouterLink } from '@angular/router';
import { UtilService } from '../../../../services/util.service';
import { AppToastComponent } from '@components/toast';
import { IToast } from 'src/interfaces';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardGroupComponent,
    TextColorDirective,
    CardComponent,
    CardBodyComponent,
    FormsModule,
    ReactiveFormsModule,
    InputGroupComponent,
    InputGroupTextDirective,
    IconDirective,
    FormControlDirective,
    ButtonDirective,
    FormDirective,
    FormFeedbackComponent,
    CommonModule,
    RouterLink,
    ToasterComponent
  ]
})
export class LoginComponent implements OnInit {
  customStylesValidated = false;
  browserDefaultsValidated = false;
  tooltipValidated = false;
  placement = ToasterPlacement.BottomEnd;

  data = {
    email: '',
    password: ''
  }

  readonly toaster = viewChild(ToasterComponent);
  private router = inject(Router);
  private utilService = inject(UtilService);
  
  constructor(private readonly authService: AuthService) { }

  ngOnInit(): void {
    this.authService.userProfile$.subscribe((profile) => {
      if (profile) {
        this.router.navigate(['/dashboard']);
      }
    });
      this.utilService.toastValues$.subscribe((values) => {
        if (values && values.open) {
          this.addToast(values.options as IToast);
          setTimeout(() => {
            this.utilService.closeToast();
          }, 100);
        }
      });
  }

  addToast(options?: IToast) {
    const componentRef = this.toaster()?.addToast(AppToastComponent, {
      ...options,
    });
    if (componentRef) {
      options?.message && (componentRef.instance.message = options.message);
      options?.color && (componentRef.instance.colorIcon = options.color);
      options?.placement &&
        (this.placement = options.placement as ToasterPlacement);
    }
  }

  onSubmit(frm: NgForm) {
    if (frm.invalid) {
      this.customStylesValidated = true;
      return;
    }

    this.authService.login(this.data).subscribe({
      next: (response) => {
        console.log('Login successful', response);
      },
      error: (error) => {
        console.error('Login failed', error);
      }
    });
  }
}
