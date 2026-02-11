import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { InvitationService } from '../../../../core/services/invitation.service';

import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent
  ],
  templateUrl: './accept-invitation.component.html'
})
export class AcceptInvitationComponent implements OnInit {
  token = '';
  processing = false;
  loadingInfo = true;
  success = false;
  errorMessage = '';
  isAuthenticated = false;

  // Invitation details
  invitedEmail = '';
  invitedRole = '';
  companyName = '';
  invitationExpired = false;

  constructor(
    private authService: AuthService,
    private invitationService: InvitationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.isAuthenticated = this.authService.isAuthenticated();

    if (!this.token) {
      this.loadingInfo = false;
      this.errorMessage = 'No invitation token provided';
      return;
    }

    // Fetch invitation details first
    this.invitationService.getInvitationInfo(this.token).subscribe({
      next: (response) => {
        this.loadingInfo = false;
        if (response.success && response.data) {
          this.invitedEmail = response.data.email;
          this.invitedRole = response.data.role;
          this.companyName = response.data.company?.name || '';
          this.invitationExpired = response.data.expired;

          if (this.invitationExpired) {
            this.errorMessage = 'This invitation has expired or is no longer valid.';
            return;
          }

          // If user is logged in, auto-accept
          if (this.isAuthenticated) {
            this.acceptInvitation();
          }
        }
      },
      error: (error) => {
        this.loadingInfo = false;
        this.errorMessage = error.message || 'Invalid invitation link';
      }
    });
  }

  acceptInvitation(): void {
    if (!this.token || this.processing) return;

    this.processing = true;
    this.errorMessage = '';

    this.invitationService.acceptInvitation(this.token).subscribe({
      next: (response) => {
        this.processing = false;
        this.success = true;

        // Update auth session with new token and user data
        if (response.data) {
          this.authService.updateSession(response.data.token, response.data.user);
        }
      },
      error: (error) => {
        this.processing = false;
        this.errorMessage = error.message || 'Failed to accept invitation';
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToLogin(): void {
    localStorage.setItem('pending_invitation_token', this.token);
    this.router.navigate(['/auth/login']);
  }

  goToRegister(): void {
    localStorage.setItem('pending_invitation_token', this.token);
    this.router.navigate(['/auth/register'], {
      queryParams: { email: this.invitedEmail }
    });
  }
}
