import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService, UtilService } from 'src/services';
import {
  ButtonDirective,
  CardComponent,
  CardBodyComponent,
  CardHeaderComponent,
  InputGroupComponent,
  FormControlDirective,
  FormDirective,
  FormLabelDirective,
  FormFeedbackComponent,
  RowComponent,
  ColComponent,
  GutterDirective,
} from '@coreui/angular';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { IUser } from 'src/interfaces';

@Component({
  selector: 'app-user-update',
  templateUrl: '../form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonDirective,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    InputGroupComponent,
    FormControlDirective,
    FormDirective,
    FormLabelDirective,
    FormFeedbackComponent,
    RowComponent,
    ColComponent,
    ProfileCardComponent,
    GutterDirective,
  ],
})
export class UpdateComponent implements OnInit {
  public info!: IUser;
  public avatarUrl = '';
  public isSubmitted = false;
  public user!: IUser;
  public userId: string | null = null;
  public loading = false;
  public customStylesValidated = false;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private utilService = inject(UtilService);

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.loadUserData();
    } else {
      this.router.navigate(['/users/list']);
    }
  }

  private loadUserData() {
    this.loading = true;
    this.userService.findOne(this.userId as string).subscribe({
      next: (resp) => {
        this.user = resp.data;
        this.info = {
          _id: resp.data._id,
          name: resp.data.name,
          email: resp.data.email,
          isActive: resp.data.isActive,
          emailVerified: resp.data.emailVerified,
          address: resp.data.address,
          bio: resp.data.bio,
          role: resp.data.role,
          type: resp.data.type,
          phoneNumber: resp.data.phoneNumber,
          avatarUrl: resp.data.avatarUrl,
          createdAt: resp.data.createdAt,
          password: '',
        };
        this.avatarUrl = resp.data.avatarUrl;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.utilService.toastError({
          title: 'Error',
          message: 'Could not load user data',
        });
      },
    });
  }

  submit(form: any) {
    this.isSubmitted = true;
    this.customStylesValidated = true;
    if (!form.valid) {
      this.utilService.toastError({
        title: 'Error',
        message: 'Please check the form and try again',
      });
      return;
    }

    const data = { ...this.info };

    if (!data.password) {
      delete data.password;
    }

    this.loading = true;
    this.userService.update(this.userId as string, data).subscribe({
      next: (resp) => {
        this.loading = false;
        this.utilService.toastSuccess({
          title: 'Success',
          message: 'User updated successfully',
        });
        this.router.navigate(['/users/list']);
      },
      error: (err) => {
        this.loading = false;
        this.utilService.toastError({
          title: 'Error',
          message: err.error?.message || 'Update failed',
        });
      },
    });
  }

  afterUpload(evt: any) {
    this.info.avatar = evt;
  }
}
