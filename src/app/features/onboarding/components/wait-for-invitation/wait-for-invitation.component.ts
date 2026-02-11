import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

@Component({
  selector: 'app-wait-for-invitation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent
  ],
  templateUrl: './wait-for-invitation.component.html'
})
export class WaitForInvitationComponent {
  checking = false;
  checkMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get userEmail(): string {
    return this.authService.getCurrentUserValue()?.email || '';
  }

  checkAgain(): void {
    this.checking = true;
    this.checkMessage = '';

    this.authService.getCurrentUser().subscribe({
      next: (response) => {
        this.checking = false;
        if (response.data?.company_id) {
          this.router.navigate(['/dashboard']);
        } else {
          this.checkMessage = 'No invitation found yet. Please check back later.';
        }
      },
      error: () => {
        this.checking = false;
        this.checkMessage = 'Unable to check status. Please try again.';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/onboarding']);
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
