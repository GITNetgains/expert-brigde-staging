import { CommonModule } from '@angular/common';
import { Component, OnInit, viewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CardBodyComponent, CardComponent, TextColorDirective, CardGroupComponent, ColComponent, RowComponent, ContainerComponent, FormControlDirective, InputGroupTextDirective, InputGroupComponent, ButtonDirective, FormFeedbackComponent, FormDirective, ToasterComponent, ToasterPlacement } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { AuthService } from '@services/index';
import { UtilService } from '@services/util.service';
import { AppToastComponent } from '@components/toast';
import { IToast } from 'src/interfaces';

@Component({
  templateUrl: 'forgot.component.html',
  imports: [
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardGroupComponent,
    TextColorDirective,
    CardComponent,
    CardBodyComponent,
    FormsModule,
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
  ],
  standalone: true,
})
export class ForgotComponent implements OnInit {
  customStylesValidated = false;
  public email: string = '';
  public submitted: Boolean = false;
  private Auth: AuthService;
  public appConfig: any;
  placement = ToasterPlacement.BottomEnd;
  
  readonly toaster = viewChild(ToasterComponent);

  constructor(
    auth: AuthService,
    public router: Router,
    private route: ActivatedRoute,
    private utilService: UtilService
  ) {
    this.Auth = auth;
    this.appConfig = this.route.snapshot.data['appConfig'];
  }

  ngOnInit(): void {
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

  forgot(frm: NgForm) {
    this.submitted = true;
    
    if (frm.invalid) {
      this.customStylesValidated = true;
      return;
    }

    this.Auth.forgot(this.email).subscribe({
      next: (resp: any) => {
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'New password has been sent, please check your email inbox.',
        });
         this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.utilService.toastError({
          title: 'Error',
          message: err.error?.data?.message || 'Your email is not registered',
        });
      }
    });
  }
}
