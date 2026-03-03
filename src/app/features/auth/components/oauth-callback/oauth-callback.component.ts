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
                <h1 class="text-2xl font-semibold text-foreground">Authentication Failed</h1>
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
                <h1 class="text-xl font-semibold text-foreground">Completing sign in...</h1>
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
    const params = this.route.snapshot.queryParams;

    // Check for error from backend redirect
    if (params['error']) {
      this.error = true;
      this.errorMessage = params['error'] === 'oauth_failed'
        ? 'OAuth authentication failed. Please try again or use email login.'
        : params['error'];
      return;
    }

    const token = params['token'];
    const userJson = params['user'];

    if (!token || !userJson) {
      this.error = true;
      this.errorMessage = 'Invalid authentication response. Please try again.';
      return;
    }

    try {
      const user: User = JSON.parse(decodeURIComponent(userJson));
      this.authService.handleOAuthCallback(token, user);

      // Check if user needs onboarding (no company)
      if (!user.company_id && user.role !== 'super_admin') {
        this.router.navigate(['/onboarding']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } catch (e) {
      this.error = true;
      this.errorMessage = 'Failed to process authentication data. Please try again.';
    }
  }
}
