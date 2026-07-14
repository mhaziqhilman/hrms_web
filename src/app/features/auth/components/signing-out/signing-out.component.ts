import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';

/**
 * Signing Out — shown after logout while the browser is handed back to the
 * Nextura hub (nextura.my). The session is already cleared by AuthService
 * before this page loads; this page only plays the transition and redirects.
 * In environments without a hub (hubUrl empty, e.g. local dev) it falls back
 * to the local login page.
 */
@Component({
  selector: 'app-signing-out',
  standalone: true,
  imports: [
    CommonModule,
    ZardCardComponent,
    ZardIconComponent
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background p-4">
      <div class="w-full max-w-md">
        <!-- Logo Section -->
        <div class="flex justify-center mb-8">
          <img alt="Nexura Logo" src="assets/images/Nexura_Logo.png" class="h-16 md:h-20" />
        </div>

        <z-card class="border shadow-lg">
          <div z-card-content class="p-6">
            <div class="text-center space-y-4">
              <div class="flex justify-center mb-4">
                <z-icon zType="loader-circle" class="w-12 h-12 text-primary animate-spin" />
              </div>
              <h1 class="text-xl font-medium text-foreground">Signing you out...</h1>
              <p class="text-sm text-muted-foreground">Returning you to the Nextura Hub.</p>
            </div>
          </div>
        </z-card>
      </div>
    </div>
  `
})
export class SigningOutComponent implements OnInit, OnDestroy {
  private redirectTimer?: ReturnType<typeof setTimeout>;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Brief pause so the transition reads as intentional, not a glitch
    this.redirectTimer = setTimeout(() => {
      if (environment.hubUrl) {
        window.location.replace(`${environment.hubUrl}/auth/login`);
      } else {
        this.router.navigate(['/auth/login']);
      }
    }, 1400);
  }

  ngOnDestroy(): void {
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
    }
  }
}
