import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService, UtilService } from 'src/services';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  ContainerComponent,
  FormControlDirective,
  FormDirective,
  FormFeedbackComponent,
  FormLabelDirective,
  RowComponent,
  ColComponent,
  ToasterPlacement,
} from '@coreui/angular';
import { ProfileCardComponent } from '../profile-card/profile-card.component';

@Component({
  selector: 'app-profile-update',
  templateUrl: './profile-update.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ContainerComponent,
    CardComponent,
    CardBodyComponent,
    ButtonDirective,
    FormDirective,
    FormControlDirective,
    FormFeedbackComponent,
    FormLabelDirective,
    RowComponent,
    ColComponent,
    ProfileCardComponent,
  ],
})
export class ProfileUpdateComponent implements OnInit {
  public profileForm!: FormGroup;
  public isSubmitted = false;
  public avatarUrl = '';
  public user: any = {};

  private readonly userService = inject(UserService);
  private readonly utilService = inject(UtilService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  get nameControl(): FormControl {
    return this.profileForm.get('name') as FormControl;
  }

  get emailControl(): FormControl {
    return this.profileForm.get('email') as FormControl;
  }

  get passwordControl(): FormControl {
    return this.profileForm.get('password') as FormControl;
  }

  get phoneNumberControl(): FormControl {
    return this.profileForm.get('phoneNumber') as FormControl;
  }

  get addressControl(): FormControl {
    return this.profileForm.get('address') as FormControl;
  }

  ngOnInit(): void {
    this.initForm();
    this.loadUserProfile();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: [''],
      phoneNumber: [''],
      password: ['', Validators.minLength(6)],
    });
  }

  private loadUserProfile(): void {
    this.userService.me().subscribe({
      next: (resp) => {
        this.user = resp.data;
        this.avatarUrl = resp.data.avatarUrl;
        this.profileForm.patchValue({
          name: resp.data.name,
          email: resp.data.email,
          address: resp.data.address,
          phoneNumber: resp.data.phoneNumber,
        });
      },
      error: (error) => {
        this.utilService.toastError({
          title: 'Error',
          message: 'Could not load profile data',
        });
      },
    });
  }

  afterUpload(avatar: any): void {
    if (typeof avatar === 'string') {
      this.avatarUrl = avatar;
    } else if (avatar && avatar.target && avatar.target.result) {
      this.avatarUrl = avatar.target.result;
    }
  }

  submit(): void {
    this.isSubmitted = true;

    if (this.profileForm.invalid) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Please check the form and try again',
      });
      return;
    }

    const formData = { ...this.profileForm.value };

    if (!formData.password) {
      delete formData.password;
    }

    this.userService.updateMe(formData).subscribe({
      next: (resp) => {
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'Profile updated successfully',
        });

        this.loadUserProfile();
      },
      error: (err) => {
        this.utilService.toastError({
          title: 'Error',
          message: err.error?.message || 'Update failed',
        });
      },
    });
  }
}
