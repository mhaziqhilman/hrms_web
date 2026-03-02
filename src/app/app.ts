import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ZardToastComponent } from '@/shared/components/toast/toast.component';
import { ThemeService } from '@/core/services/theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ZardToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('HRMS_v1');

  private themeService = inject(ThemeService);
  protected toasterTheme = computed(() => this.themeService.darkMode() ? 'dark' : 'light');
}
