import { Injectable, signal, computed, OnDestroy } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';
export type BorderRadiusPreset = 'sharp' | 'default' | 'round';
export type FontFamilyPreset = 'plus-jakarta-sans' | 'geist' | 'figtree';

const RADIUS_VALUES: Record<BorderRadiusPreset, string> = {
  sharp: '0.45rem',
  default: '0.65rem',
  round: '0.85rem'
};

const FONT_FAMILY_VALUES: Record<FontFamilyPreset, string> = {
  'plus-jakarta-sans': "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  'geist': "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  'figtree': "'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
};

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
  borderRadius = signal<BorderRadiusPreset>('default');
  fontFamily = signal<FontFamilyPreset>('plus-jakarta-sans');
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
    const savedRadius = localStorage.getItem('border_radius') as BorderRadiusPreset | null;
    const savedFontFamily = localStorage.getItem('font_family') as FontFamilyPreset | null;
    const savedSidebar = localStorage.getItem('sidebar_collapsed');

    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      this.themePreference.set(savedTheme);
    }
    if (savedCompact !== null) {
      this.compactMode.set(savedCompact === 'true');
    }
    if (savedRadius && ['sharp', 'default', 'round'].includes(savedRadius)) {
      this.borderRadius.set(savedRadius);
    }
    if (savedFontFamily && ['plus-jakarta-sans', 'geist', 'figtree'].includes(savedFontFamily)) {
      this.fontFamily.set(savedFontFamily);
    }
    if (savedSidebar !== null) {
      this.sidebarCollapsed.set(savedSidebar === 'true');
    }

    // Apply initial state
    this.applyDarkClass(this.darkMode());
    this.applyCompactClass(this.compactMode());
    this.applyBorderRadius(this.borderRadius());
    this.applyFontFamily(this.fontFamily());
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

  setBorderRadius(preset: BorderRadiusPreset): void {
    this.borderRadius.set(preset);
    localStorage.setItem('border_radius', preset);
    this.applyBorderRadius(preset);
  }

  setFontFamily(preset: FontFamilyPreset): void {
    this.fontFamily.set(preset);
    localStorage.setItem('font_family', preset);
    this.applyFontFamily(preset);
  }

  /**
   * Resolved CSS font-family stack for the active preset (or a given one).
   * Use this when rendering into isolated documents (print windows, PDF
   * iframes) that don't inherit the `--font-family` CSS variable.
   */
  getFontFamilyValue(preset: FontFamilyPreset = this.fontFamily()): string {
    return FONT_FAMILY_VALUES[preset];
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

  private applyBorderRadius(preset: BorderRadiusPreset): void {
    document.documentElement.style.setProperty('--radius', RADIUS_VALUES[preset]);
  }

  private applyFontFamily(preset: FontFamilyPreset): void {
    document.documentElement.style.setProperty('--font-family', FONT_FAMILY_VALUES[preset]);
  }
}
