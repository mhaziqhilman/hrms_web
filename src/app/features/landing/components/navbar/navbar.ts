import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../../core/services/theme';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  themeService = inject(ThemeService);
  isDark = this.themeService.darkMode;

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
