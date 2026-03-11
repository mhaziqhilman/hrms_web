import { Pipe, PipeTransform, inject } from '@angular/core';
import { DisplayService } from '@/core/services/display.service';

/** Formats a date value using the user's preferred date format and timezone. */
@Pipe({ name: 'appDate', standalone: true, pure: false })
export class AppDatePipe implements PipeTransform {
  private display = inject(DisplayService);

  transform(value: string | Date | null | undefined): string {
    return this.display.formatDate(value);
  }
}

/** Formats a date value to show only time in user's preferred 12h/24h format. */
@Pipe({ name: 'appTime', standalone: true, pure: false })
export class AppTimePipe implements PipeTransform {
  private display = inject(DisplayService);

  transform(value: string | Date | null | undefined): string {
    return this.display.formatTime(value);
  }
}

/** Formats a date value as full datetime using user preferences. */
@Pipe({ name: 'appDateTime', standalone: true, pure: false })
export class AppDateTimePipe implements PipeTransform {
  private display = inject(DisplayService);

  transform(value: string | Date | null | undefined): string {
    return this.display.formatDateTime(value);
  }
}
