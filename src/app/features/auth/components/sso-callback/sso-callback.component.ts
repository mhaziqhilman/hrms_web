import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

/**
 * SSO Callback — receives a token handoff from the Nextura hub (nextura.my).
 * The hub links here as /auth/sso#token=...&refresh=...&next=/dashboard —
 * the payload rides in the URL fragment so it never reaches servers or logs.
 * The token is validated against the API before a session is established.
 */
@Component({
  selector: 'app-sso-callback',
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
                <h1 class="text-2xl font-medium text-foreground">Sign-in Failed</h1>
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
                <h1 class="text-xl font-medium text-foreground">Signing you in...</h1>
                <p class="text-sm text-muted-foreground">Completing your Nextura session.</p>
              </div>
            }
          </div>
        </z-card>
      </div>
    </div>
  `
})
export class SsoCallbackComponent implements OnInit {
  error = false;
  errorMessage = 'Your sign-in link is invalid or has expired. Please sign in again.';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Payload rides in the fragment: #token=...&refresh=...&next=...
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('token');
    const refreshToken = params.get('refresh') || undefined;
    const next = params.get('next') || '/dashboard';

    // Scrub the token from the address bar immediately
    history.replaceState(null, '', window.location.pathname);

    if (!token) {
      this.error = true;
      return;
    }

    this.authService.completeSsoLogin(token, refreshToken).subscribe({
      next: (user) => {
        // Only allow internal destinations (no protocol-relative or absolute URLs)
        const target = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
        if (!user.company_id && user.role !== 'super_admin') {
          this.router.navigate(['/onboarding']);
        } else {
          this.router.navigateByUrl(target);
        }
      },
      error: () => {
        this.error = true;
      }
    });
  }
}
