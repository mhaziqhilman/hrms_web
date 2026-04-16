import { Component, computed, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router, RouterOutlet, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Capacitor } from '@capacitor/core';
import { ZardToastComponent } from '@/shared/components/toast/toast.component';
import { ThemeService } from '@/core/services/theme';
import { LoadingBarService } from '@/core/services/loading-bar.service';
import { LoadingBarComponent } from '@/shared/components/loading-bar/loading-bar.component';
import { AuthService } from '@/core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ZardToastComponent, LoadingBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('HRMS_v1');

  private themeService = inject(ThemeService);
  private router = inject(Router);
  private loadingBar = inject(LoadingBarService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  protected toasterTheme = computed(() => this.themeService.darkMode() ? 'dark' : 'light');

  ngOnInit(): void {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loadingBar.setRouteLoading(true);
      } else if (event instanceof NavigationEnd) {
        this.loadingBar.setRouteLoading(false);
        this.redirectToMobileIfNative(event.urlAfterRedirects);
      } else if (event instanceof NavigationCancel || event instanceof NavigationError) {
        this.loadingBar.setRouteLoading(false);
      }
    });
  }

  private redirectToMobileIfNative(url: string): void {
    if (!Capacitor.isNativePlatform()) return;
    if (url.startsWith('/m') || url.startsWith('/onboarding')) return;
    if (url.startsWith('/auth')) {
      void this.router.navigateByUrl('/m/login', { replaceUrl: true });
      return;
    }
    const target = this.authService.isAuthenticated() ? '/m/home' : '/m/login';
    void this.router.navigateByUrl(target, { replaceUrl: true });
  }
}
