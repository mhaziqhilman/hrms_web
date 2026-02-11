import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

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
export class OnboardingChoiceComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  createCompany(): void {
    this.router.navigate(['/onboarding/setup']);
  }

  waitForInvitation(): void {
    this.router.navigate(['/onboarding/waiting']);
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
