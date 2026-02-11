import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

@Component({
  selector: 'app-verify-email-pending',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent
  ],
  templateUrl: './verify-email-pending.component.html'
})
export class VerifyEmailPendingComponent {
  resending = false;
  resendSuccess = false;
  resendError = '';
  cooldown = 0;
  private cooldownInterval: any;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get userEmail(): string {
    return this.authService.getCurrentUserValue()?.email || '';
  }

  resendVerification(): void {
    if (this.cooldown > 0 || this.resending) return;

    this.resending = true;
    this.resendSuccess = false;
    this.resendError = '';

    this.authService.resendVerification().subscribe({
      next: () => {
        this.resending = false;
        this.resendSuccess = true;
        this.startCooldown();
      },
      error: (error) => {
        this.resending = false;
        this.resendError = error.message || 'Failed to resend verification email';
      }
    });
  }

  private startCooldown(): void {
    this.cooldown = 60;
    this.cooldownInterval = setInterval(() => {
      this.cooldown--;
      if (this.cooldown <= 0) {
        clearInterval(this.cooldownInterval);
      }
    }, 1000);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {},
      error: () => {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }
}
