import { Injectable, signal } from '@angular/core';

export type DateFormatPreset = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type TimeFormatPreset = '12h' | '24h';

@Injectable({ providedIn: 'root' })
export class DisplayService {
  // Signals so components/pipes can react to changes
  dateFormat = signal<DateFormatPreset>('DD/MM/YYYY');
  timeFormat = signal<TimeFormatPreset>('12h');
  timezone = signal<string>('Asia/Kuala_Lumpur');
  language = signal<string>('en');

  /** Called when settings are loaded or saved */
  update(prefs: { date_format?: string; time_format?: string; timezone?: string; language?: string }): void {
    if (prefs.date_format) this.dateFormat.set(prefs.date_format as DateFormatPreset);
    if (prefs.time_format) this.timeFormat.set(prefs.time_format as TimeFormatPreset);
    if (prefs.timezone) this.timezone.set(prefs.timezone);
    if (prefs.language) this.language.set(prefs.language);
  }

  /**
   * Format a date string/Date according to the user's preferred date format and timezone.
   */
  formatDate(value: string | Date | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';

    const options: Intl.DateTimeFormatOptions = { timeZone: this.timezone() };
    const fmt = this.dateFormat();

    // Use Intl to get the parts, then arrange per format
    const parts = new Intl.DateTimeFormat('en-GB', {
      ...options,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).formatToParts(date);

    const day = parts.find(p => p.type === 'day')?.value ?? '';
    const month = parts.find(p => p.type === 'month')?.value ?? '';
    const year = parts.find(p => p.type === 'year')?.value ?? '';

    switch (fmt) {
      case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
      case 'DD/MM/YYYY':
      default: return `${day}/${month}/${year}`;
    }
  }

  /**
   * Format a date string/Date to show time according to user's 12h/24h preference.
   */
  formatTime(value: string | Date | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat('en-US', {
      timeZone: this.timezone(),
      hour: '2-digit',
      minute: '2-digit',
      hour12: this.timeFormat() === '12h'
    }).format(date);
  }

  /**
   * Format a date string/Date as full datetime (date + time).
   */
  formatDateTime(value: string | Date | null | undefined): string {
    if (!value) return '-';
    const d = this.formatDate(value);
    const t = this.formatTime(value);
    return d === '-' ? '-' : `${d} ${t}`;
  }
}
