import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AuthRoutingModule } from './auth-routing-module';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { VerifyEmailPendingComponent } from './components/verify-email-pending/verify-email-pending.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { AcceptInvitationComponent } from './components/accept-invitation/accept-invitation.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthRoutingModule,
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    VerifyEmailPendingComponent,
    VerifyEmailComponent,
    AcceptInvitationComponent
  ]
})
export class AuthModule { }
