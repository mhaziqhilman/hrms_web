import { Component, OnInit, OnDestroy, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { Subscription, finalize } from 'rxjs';

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
  verifying = signal(true);
  success = signal(false);
  errorMessage = signal('');
  private subscription?: Subscription;
  private timeoutId?: ReturnType<typeof setTimeout>;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.verifying.set(false);
      this.errorMessage.set('No verification token provided');
      return;
    }

    // Safety timeout - stop spinner after 15s if API hasn't responded
    this.timeoutId = setTimeout(() => {
      if (this.verifying()) {
        this.verifying.set(false);
        this.errorMessage.set('Verification timed out. Please try again or request a new link.');
        this.cdr.detectChanges();
      }
    }, 15000);

    this.subscription = this.authService.verifyEmail(token).pipe(
      finalize(() => {
        // Guaranteed to run whether success or error - safety net
        if (this.verifying()) {
          this.verifying.set(false);
          if (!this.success() && !this.errorMessage()) {
            this.errorMessage.set('Verification completed with an unexpected result. Please try logging in.');
          }
          this.cdr.detectChanges();
        }
        this.clearSafetyTimeout();
      })
    ).subscribe({
      next: () => {
        this.clearSafetyTimeout();
        this.verifying.set(false);
        this.success.set(true);
        localStorage.removeItem('pending_invitation_token');
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.clearSafetyTimeout();
        this.verifying.set(false);
        this.errorMessage.set(error?.message || 'Verification failed. The link may have expired.');
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.clearSafetyTimeout();
  }

  private clearSafetyTimeout(): void {
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
