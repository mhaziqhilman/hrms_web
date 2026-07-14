import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/auth.models';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background p-4">
      <div class="w-full max-w-md">
        <!-- Logo Section -->
        <div class="flex justify-center mb-8">
          <a routerLink="/" class="flex items-center">
            <img alt="Nexura Logo" src="assets/images/Nexura_Logo.png" class="h-16 md:h-20" />
          </a>
        </div>

        <z-card class="border shadow-lg">
          <div z-card-content class="p-6">
            @if (error) {
              <!-- Error State -->
              <div class="text-center space-y-4">
                <div class="flex justify-center mb-4">
                  <div class="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                    <z-icon zType="circle-x" class="w-8 h-8 text-destructive" />
                  </div>
                </div>
                <h1 class="text-2xl font-medium text-foreground">Authentication Failed</h1>
                <p class="text-sm text-muted-foreground">{{ errorMessage }}</p>
                <button z-button type="button" class="w-full mt-4" routerLink="/auth/login">
                  Back to Login
                </button>
              </div>
            } @else {
              <!-- Loading State -->
              <div class="text-center space-y-4">
                <div class="flex justify-center mb-4">
                  <z-icon zType="loader-circle" class="w-12 h-12 text-primary animate-spin" />
                </div>
                <h1 class="text-xl font-medium text-foreground">Completing sign in...</h1>
                <p class="text-sm text-muted-foreground">Please wait while we set up your session.</p>
              </div>
            }
          </div>
        </z-card>
      </div>
    </div>
  `
})
export class OAuthCallbackComponent implements OnInit {
  error = false;
  errorMessage = 'Something went wrong during authentication. Please try again.';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Tokens arrive in the URL *fragment* (#token=…) so they never reach
    // servers or logs. Legacy query params are kept as a fallback for
    // in-flight sessions during the transition.
    const fragment = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
    const query = this.route.snapshot.queryParams;

    // Scrub tokens from the address bar immediately
    if (window.location.hash || query['token']) {
      history.replaceState(null, '', window.location.pathname);
    }

    const error = fragment.get('error') || query['error'];
    if (error) {
      this.error = true;
      this.errorMessage = error === 'oauth_failed'
        ? 'OAuth authentication failed. Please try again or use email login.'
        : error;
      return;
    }

    const token = fragment.get('token') || query['token'];
    const refreshToken = fragment.get('refresh') || query['refreshToken'] || undefined;
    const next = this.sanitizeNext(fragment.get('next'));

    if (!token) {
      this.error = true;
      this.errorMessage = 'Invalid authentication response. Please try again.';
      return;
    }

    // Validate the token against the API and load the real profile —
    // never trust user data carried in the URL.
    this.authService.completeSsoLogin(token, refreshToken).subscribe({
      next: (user: User) => {
        if (!user.company_id && user.role !== 'super_admin') {
          this.router.navigate(['/onboarding']);
        } else {
          this.router.navigateByUrl(next || '/dashboard');
        }
      },
      error: () => {
        this.error = true;
        this.errorMessage = 'Failed to verify your session. Please try again.';
      }
    });
  }

  /** Only allow same-app absolute paths (no external or protocol-relative URLs). */
  private sanitizeNext(next: string | null): string | null {
    return next && /^\/(?!\/)/.test(next) ? next : null;
  }
}
