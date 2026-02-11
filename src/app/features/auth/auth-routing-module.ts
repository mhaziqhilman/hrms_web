import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { VerifyEmailPendingComponent } from './components/verify-email-pending/verify-email-pending.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { AcceptInvitationComponent } from './components/accept-invitation/accept-invitation.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'verify-email-pending', component: VerifyEmailPendingComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'accept-invitation', component: AcceptInvitationComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
