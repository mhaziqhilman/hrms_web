import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { Subscription } from 'rxjs';

import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent
  ],
  templateUrl: './verify-email.component.html'
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  verifying = true;
  success = false;
  errorMessage = '';
  private subscription?: Subscription;
  private timeoutId?: ReturnType<typeof setTimeout>;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.verifying = false;
      this.errorMessage = 'No verification token provided';
      return;
    }

    // Safety timeout - stop spinner after 15s if API hasn't responded
    this.timeoutId = setTimeout(() => {
      this.ngZone.run(() => {
        if (this.verifying) {
          this.verifying = false;
          this.errorMessage = 'Verification timed out. Please try again or request a new link.';
        }
      });
    }, 15000);

    this.subscription = this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.clearTimeout();
        this.verifying = false;
        this.success = true;
      },
      error: (error: any) => {
        this.clearTimeout();
        this.verifying = false;
        this.errorMessage = error?.message || 'Verification failed. The link may have expired.';
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.clearTimeout();
  }

  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }

  continue(): void {
    const user = this.authService.getCurrentUserValue();
    if (user?.company_id) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/onboarding']);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
