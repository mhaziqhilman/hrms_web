import { Injectable, signal, computed, OnDestroy } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService implements OnDestroy {
  themePreference = signal<ThemePreference>('light');
  darkMode = computed(() => {
    const pref = this.themePreference();
    if (pref === 'system') {
      return this.systemPrefersDark();
    }
    return pref === 'dark';
  });

  compactMode = signal(false);
  sidebarCollapsed = signal(false);

  private systemPrefersDark = signal(false);
  private mediaQuery: MediaQueryList | null = null;
  private mediaListener = (e: MediaQueryListEvent) => {
    this.systemPrefersDark.set(e.matches);
    if (this.themePreference() === 'system') {
      this.applyDarkClass(e.matches);
    }
  };

  constructor() {
    // Set up system preference detection
    if (window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.systemPrefersDark.set(this.mediaQuery.matches);
      this.mediaQuery.addEventListener('change', this.mediaListener);
    }

    // Load saved preferences from localStorage
    const savedTheme = localStorage.getItem('theme') as ThemePreference | null;
    const savedCompact = localStorage.getItem('compact_mode');
    const savedSidebar = localStorage.getItem('sidebar_collapsed');

    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      this.themePreference.set(savedTheme);
    }
    if (savedCompact !== null) {
      this.compactMode.set(savedCompact === 'true');
    }
    if (savedSidebar !== null) {
      this.sidebarCollapsed.set(savedSidebar === 'true');
    }

    // Apply initial state
    this.applyDarkClass(this.darkMode());
    this.applyCompactClass(this.compactMode());
  }

  ngOnDestroy(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.mediaListener);
    }
  }

  setTheme(theme: ThemePreference): void {
    this.themePreference.set(theme);
    localStorage.setItem('theme', theme);
    this.applyDarkClass(this.darkMode());
  }

  toggleTheme(): void {
    const current = this.themePreference();
    if (current === 'system') {
      // When on system, toggle to the opposite of current effective state
      this.setTheme(this.darkMode() ? 'light' : 'dark');
    } else {
      this.setTheme(current === 'dark' ? 'light' : 'dark');
    }
  }

  setCompactMode(compact: boolean): void {
    this.compactMode.set(compact);
    localStorage.setItem('compact_mode', String(compact));
    this.applyCompactClass(compact);
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsed.set(collapsed);
    localStorage.setItem('sidebar_collapsed', String(collapsed));
  }

  private applyDarkClass(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private applyCompactClass(compact: boolean): void {
    if (compact) {
      document.documentElement.classList.add('compact');
    } else {
      document.documentElement.classList.remove('compact');
    }
  }
}
