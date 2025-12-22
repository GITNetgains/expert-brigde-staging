import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, UtilService } from 'src/services';
import { ToasterPlacement } from '@coreui/angular';
import {
  ButtonDirective,
  CardComponent,
  CardBodyComponent,
  CardHeaderComponent,
  FormControlDirective,
  FormDirective,
  FormLabelDirective,
  FormFeedbackComponent,
  InputGroupComponent,
  RowComponent,
  ColComponent,
  GutterDirective,
} from '@coreui/angular';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { IUser } from 'src/interfaces';
@Component({
  selector: 'app-user-create',
  templateUrl: '../form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    FormControlDirective,
    FormDirective,
    FormLabelDirective,
    FormFeedbackComponent,
    InputGroupComponent,
    RowComponent,
    ColComponent,
    ProfileCardComponent,
    GutterDirective,
  ],
})
export class CreateComponent implements OnInit {
  public info: IUser = {
    _id: '',
    type: 'student',
    name: '',
    email: '',
    address: '',
    phoneNumber: '',
    role: 'user',
    emailVerified: true,
    isActive: true,
    avatarUrl: '',
    avatar: '',
    password: '',
  };
  public isSubmitted = false;
  public loading = false;
  public userId: string | null = null;
  public customStylesValidated = false;

  private router = inject(Router);
  private userService = inject(UserService);
  private utilService = inject(UtilService);

  ngOnInit() {}

  submit(form: any) {
    this.isSubmitted = true;
    this.customStylesValidated = true;
    if (!form.valid) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Something went wrong, please check and try again!',
      });
      return;
    }

    const data = {
      name: this.info.name,
      email: this.info.email,
      role: this.info.role,
      isActive: this.info.isActive,
      emailVerified: this.info.emailVerified,
      address: this.info.address,
      type: this.info.type,
      password: this.info.password,
      phoneNumber: this.info.phoneNumber,
      avatar: this.info.avatar,
    };

    this.loading = true;
    this.userService.create(data).subscribe({
      next: (resp) => {
        this.loading = false;
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'User created successfully!',
        });
        this.router.navigate(['/users/list']);
      },
      error: (err) => {
        this.loading = false;
        if (
          err.error?.message?.includes('duplicate key') &&
          err.error?.message?.includes('email')
        ) {
          this.utilService.toastError({
            title: 'Email Already Exists',
            message: `The email "${this.info.email}" is already registered in the system. Please use a different email address.`,
          });
        } else {
          this.utilService.toastError({
            title: 'Error',
            message: err.error?.message || 'Failed to create user',
          });
        }
      },
    });
  }

  afterUpload(evt: string) {
    this.info.avatar = evt;
  }
}
