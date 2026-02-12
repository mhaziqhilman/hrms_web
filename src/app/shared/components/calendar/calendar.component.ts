import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZardButtonComponent } from '../button/button.component';
import { ZardIconComponent } from '../icon/icon.component';

@Component({
  selector: 'z-calendar',
  standalone: true,
  imports: [CommonModule, ZardButtonComponent, ZardIconComponent],
  template: `
    <div class="p-3">
      <!-- Month/Year Header -->
      <div class="flex items-center justify-between mb-4">
        <button
          z-button
          zType="ghost"
          zSize="sm"
          (click)="previousMonth()"
          [disabled]="disabled"
          class="h-7 w-7 p-0">
          <z-icon zType="chevron-left" class="w-4 h-4" />
        </button>

        <div class="flex items-center gap-1">
          <select
            [value]="currentMonth()"
            (change)="onMonthSelect($event)"
            [disabled]="disabled"
            class="text-sm font-semibold bg-transparent border border-border rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_4px_center] pr-5">
            @for (m of monthOptions; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
          <select
            [value]="currentYear()"
            (change)="onYearSelect($event)"
            [disabled]="disabled"
            class="text-sm font-semibold bg-transparent border border-border rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_4px_center] pr-5">
            @for (y of yearOptions; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
        </div>

        <button
          z-button
          zType="ghost"
          zSize="sm"
          (click)="nextMonth()"
          [disabled]="disabled"
          class="h-7 w-7 p-0">
          <z-icon zType="chevron-right" class="w-4 h-4" />
        </button>
      </div>

      <!-- Weekday Headers -->
      <div class="grid grid-cols-7 gap-1 mb-2">
        @for (day of weekDays; track day) {
          <div class="text-center text-xs font-medium text-muted-foreground h-7 flex items-center justify-center">
            {{ day }}
          </div>
        }
      </div>

      <!-- Calendar Grid -->
      <div class="grid grid-cols-7 gap-1">
        @for (day of calendarDays(); track day.date) {
          <button
            type="button"
            (click)="selectDate(day.date)"
            [disabled]="disabled || !day.isCurrentMonth || isDateDisabled(day.date)"
            [class]="getDayClasses(day)"
            class="h-8 w-8 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {{ day.day }}
          </button>
        }
      </div>
    </div>
  `
})
export class ZardCalendarComponent {
  @Input() value: Date | null = null;
  @Input() minDate?: Date;
  @Input() maxDate?: Date;
  @Input() disabled = false;

  @Output() dateChange = new EventEmitter<Date | null>();

  currentMonth = signal(new Date().getMonth());
  currentYear = signal(new Date().getFullYear());

  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  monthOptions = [
    { value: 0, label: 'Jan' }, { value: 1, label: 'Feb' }, { value: 2, label: 'Mar' },
    { value: 3, label: 'Apr' }, { value: 4, label: 'May' }, { value: 5, label: 'Jun' },
    { value: 6, label: 'Jul' }, { value: 7, label: 'Aug' }, { value: 8, label: 'Sep' },
    { value: 9, label: 'Oct' }, { value: 10, label: 'Nov' }, { value: 11, label: 'Dec' }
  ];

  yearOptions: number[] = [];

  constructor() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 10; y <= currentYear + 10; y++) {
      this.yearOptions.push(y);
    }
  }

  calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days: Array<{ date: Date; day: number; isCurrentMonth: boolean }> = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push({
        date: new Date(current),
        day: current.getDate(),
        isCurrentMonth: current.getMonth() === month
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  });

  ngOnInit() {
    if (this.value) {
      this.currentMonth.set(this.value.getMonth());
      this.currentYear.set(this.value.getFullYear());
    }
  }

  previousMonth() {
    const month = this.currentMonth();
    const year = this.currentYear();

    if (month === 0) {
      this.currentMonth.set(11);
      this.currentYear.set(year - 1);
    } else {
      this.currentMonth.set(month - 1);
    }
  }

  onMonthSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.currentMonth.set(Number(select.value));
  }

  onYearSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.currentYear.set(Number(select.value));
  }

  nextMonth() {
    const month = this.currentMonth();
    const year = this.currentYear();

    if (month === 11) {
      this.currentMonth.set(0);
      this.currentYear.set(year + 1);
    } else {
      this.currentMonth.set(month + 1);
    }
  }

  selectDate(date: Date) {
    if (!this.isDateDisabled(date)) {
      this.dateChange.emit(date);
    }
  }

  isDateDisabled(date: Date): boolean {
    if (this.minDate && date < this.minDate) return true;
    if (this.maxDate && date > this.maxDate) return true;
    return false;
  }

  isSameDay(date1: Date, date2: Date | null): boolean {
    if (!date2) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return this.isSameDay(date, today);
  }

  getDayClasses(day: { date: Date; isCurrentMonth: boolean }): string {
    const classes: string[] = [];

    if (!day.isCurrentMonth) {
      classes.push('text-muted-foreground');
    }

    if (this.isSameDay(day.date, this.value)) {
      classes.push('bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground');
    } else if (this.isToday(day.date)) {
      classes.push('bg-accent text-accent-foreground');
    } else {
      classes.push('hover:bg-accent hover:text-accent-foreground');
    }

    return classes.join(' ');
  }

  getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  }
}
