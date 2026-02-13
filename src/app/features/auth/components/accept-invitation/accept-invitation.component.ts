import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { timeout } from 'rxjs/operators';
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
export class AcceptInvitationComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);

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

  private subscriptions: Subscription[] = [];

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

    this.loadInvitationInfo();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  private loadInvitationInfo(): void {
    this.loadingInfo = true;
    this.errorMessage = '';

    const sub = this.invitationService.getInvitationInfo(this.token).pipe(
      timeout(20000)
    ).subscribe({
      next: (response) => {
        this.zone.run(() => {
          this.loadingInfo = false;

          if (response.success && response.data) {
            this.invitedEmail = response.data.email;
            this.invitedRole = response.data.role;
            this.companyName = response.data.company?.name || '';
            this.invitationExpired = response.data.expired;

            if (this.invitationExpired) {
              this.errorMessage = 'This invitation has expired or is no longer valid.';
            } else if (this.isAuthenticated) {
              this.acceptInvitation();
            }
          } else {
            this.errorMessage = 'Unable to load invitation details.';
          }

          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.zone.run(() => {
          this.loadingInfo = false;

          if (error?.name === 'TimeoutError') {
            this.errorMessage = 'Server is taking too long to respond. Please try again.';
          } else {
            const msg = error?.error?.message || error?.message || '';
            this.errorMessage = msg || 'Failed to load invitation. Please check the link and try again.';
          }

          this.cdr.detectChanges();
        });
      }
    });
    this.subscriptions.push(sub);
  }

  acceptInvitation(): void {
    if (!this.token || this.processing) return;

    this.processing = true;
    this.errorMessage = '';

    const sub = this.invitationService.acceptInvitation(this.token).pipe(
      timeout(20000)
    ).subscribe({
      next: (response) => {
        this.zone.run(() => {
          this.processing = false;
          if (response.success && response.data) {
            this.success = true;
            this.authService.updateSession(response.data.token, response.data.user);
          } else {
            this.errorMessage = 'Failed to accept invitation. Please try again.';
          }
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.zone.run(() => {
          this.processing = false;
          if (error?.name === 'TimeoutError') {
            this.errorMessage = 'Server is taking too long to respond. Please try again.';
          } else {
            this.errorMessage = error?.message || 'Failed to accept invitation';
          }
          this.cdr.detectChanges();
        });
      }
    });
    this.subscriptions.push(sub);
  }

  retryLoad(): void {
    this.loadInvitationInfo();
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
