import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { SignupComponent } from './register/signup.component';
import { ForgotComponent } from './forgot/forgot.component';
import { GoogleCallbackComponent } from './google-callback/google-callback.component';
import { LinkedinCallbackComponent } from './linkedin-callback/linkedin-callback.component';
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'sign-up',
    component: SignupComponent,
    resolve: {}
  },
  {
    path: 'forgot',
    component: ForgotComponent
  }
  ,
  {
    path: 'google/callback',
    component: GoogleCallbackComponent
  }
  ,
  {
    path: 'linkedin/callback',
    component: LinkedinCallbackComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
