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
  success = false;
  errorMessage = '';
  isAuthenticated = false;

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
      this.errorMessage = 'No invitation token provided';
      return;
    }

    // If user is logged in, auto-accept
    if (this.isAuthenticated) {
      this.acceptInvitation();
    }
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
          localStorage.setItem('hrms_token', response.data.token);
          localStorage.setItem('hrms_user', JSON.stringify(response.data.user));
          // Refresh the auth service state
          this.authService.getCurrentUser().subscribe();
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
    // Store the invitation token so it can be used after login
    sessionStorage.setItem('pending_invitation_token', this.token);
    this.router.navigate(['/auth/login']);
  }

  goToRegister(): void {
    sessionStorage.setItem('pending_invitation_token', this.token);
    this.router.navigate(['/auth/register']);
  }
}
