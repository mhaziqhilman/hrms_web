import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { InvitationService } from '../../../../core/services/invitation.service';

import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

@Component({
  selector: 'app-onboarding-choice',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent
  ],
  templateUrl: './onboarding-choice.component.html'
})
export class OnboardingChoiceComponent implements OnInit {
  hasExistingCompany = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private invitationService: InvitationService
  ) {
    this.hasExistingCompany = this.authService.hasCompany();
  }

  ngOnInit(): void {
    // Clear any stale localStorage invitation token
    localStorage.removeItem('pending_invitation_token');

    // Ask the server to auto-accept any pending invitations for this user's email
    this.invitationService.autoAccept().subscribe({
      next: (response: any) => {
        if (response.data?.accepted && response.data?.token) {
          this.authService.updateSession(response.data.token, response.data.user);
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {
        // No invitation found or error - stay on onboarding page
      }
    });
  }

  createCompany(): void {
    this.router.navigate(['/onboarding/setup']);
  }

  waitForInvitation(): void {
    this.router.navigate(['/onboarding/waiting']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {},
      error: () => {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}
