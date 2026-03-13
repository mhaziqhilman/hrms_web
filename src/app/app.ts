import { Component, computed, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { Router, RouterOutlet, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ZardToastComponent } from '@/shared/components/toast/toast.component';
import { ThemeService } from '@/core/services/theme';
import { LoadingBarService } from '@/core/services/loading-bar.service';
import { LoadingBarComponent } from '@/shared/components/loading-bar/loading-bar.component';

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
  protected toasterTheme = computed(() => this.themeService.darkMode() ? 'dark' : 'light');

  ngOnInit(): void {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loadingBar.setRouteLoading(true);
      } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.loadingBar.setRouteLoading(false);
      }
    });
  }
}
