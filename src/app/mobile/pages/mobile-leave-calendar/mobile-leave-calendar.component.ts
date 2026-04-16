import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { LeaveService } from '@/features/leave/services/leave.service';
import {
  CalendarDay,
  LEAVE_TYPE_COLORS,
  Leave,
  LeaveStatus,
  PublicHoliday,
} from '@/features/leave/models/leave.model';

import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { MobilePageHeaderComponent } from '@/mobile/shared/mobile-page-header.component';
import { MobileEmptyStateComponent } from '@/mobile/shared/mobile-empty-state.component';

const HOLIDAY_COLOR = '#a855f7';

@Component({
  selector: 'app-mobile-leave-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ZardIconComponent,
    MobilePageHeaderComponent,
    MobileEmptyStateComponent,
  ],
  template: `
    <section class="space-y-4 pb-24">
      <app-mobile-page-header title="Team calendar" subtitle="See who's on leave">
        <a
          slot="action"
          routerLink="/m/leave"
          class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 active:scale-95"
          aria-label="Back"
        >
          <z-icon zType="chevron-left" zSize="default"></z-icon>
        </a>
      </app-mobile-page-header>

      <!-- Month summary -->
      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-neutral-500">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Approved
          </div>
          <p class="mt-1 text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
            {{ approvedCount() }}
          </p>
        </div>
        <div class="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-neutral-500">
            <span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Pending
          </div>
          <p class="mt-1 text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
            {{ pendingCount() }}
          </p>
        </div>
      </div>

      <!-- Month nav (no outer card) -->
      <div class="flex items-center justify-between">
        <button
          type="button"
          (click)="previousMonth()"
          class="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 active:bg-neutral-100 dark:active:bg-neutral-800"
          aria-label="Previous month"
        >
          <z-icon zType="chevron-left" zSize="default"></z-icon>
        </button>
        <button
          type="button"
          (click)="goToToday()"
          class="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50"
        >
          {{ monthName() }} {{ currentYear() }}
        </button>
        <button
          type="button"
          (click)="nextMonth()"
          class="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 active:bg-neutral-100 dark:active:bg-neutral-800"
          aria-label="Next month"
        >
          <z-icon zType="chevron-right" zSize="default"></z-icon>
        </button>
      </div>

      <!-- Weekday header -->
      <div class="grid grid-cols-7 text-center text-xs font-medium uppercase tracking-wider text-neutral-400">
        @for (wd of weekDays; track $index) {
          <div class="py-1.5">{{ wd }}</div>
        }
      </div>

      <!-- Calendar grid (edge-to-edge, generous cells) -->
      @if (loading()) {
        <div class="grid grid-cols-7 gap-y-2">
          @for (_ of skeletonCells; track $index) {
            <div class="flex items-center justify-center py-1.5">
              <span class="h-9 w-9 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800"></span>
            </div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-7 gap-y-2">
          @for (day of calendarDays(); track day.date.getTime()) {
            <button
              type="button"
              [disabled]="!day.isCurrentMonth"
              (click)="selectDay(day)"
              class="group flex flex-col items-center justify-center py-1.5 transition disabled:opacity-0"
            >
              <span
                class="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition"
                [class]="numberClass(day)"
              >
                {{ day.day }}
              </span>
              @if (day.isCurrentMonth && (day.leaves.length > 0 || day.holidays.length > 0)) {
                <div class="mt-0.5 flex items-center gap-0.5">
                  @for (dot of dotsFor(day); track $index) {
                    <span class="h-1 w-1 rounded-full" [style.background-color]="dot"></span>
                  }
                  @if (extraFor(day) > 0) {
                    <span class="text-[8px] font-bold text-neutral-400">+{{ extraFor(day) }}</span>
                  }
                </div>
              }
            </button>
          }
        </div>
      }

      <!-- Legend -->
      @if (legendItems().length > 0) {
        <div class="flex flex-wrap gap-1.5">
          @for (item of legendItems(); track item.label) {
            <span class="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              <span class="h-1.5 w-1.5 rounded-full" [style.background-color]="item.color"></span>
              {{ item.label }}
            </span>
          }
        </div>
      }

      <!-- Selected-day list (same card style as mobile leave page) -->
      @if (selectedDay(); as day) {
        <div class="space-y-3 pt-1">
          <div class="flex items-end justify-between">
            <div>
              <p class="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                {{ dayLabel(day.date) }}
              </p>
              <h2 class="mt-0.5 text-base font-semibold text-neutral-900 dark:text-neutral-50">
                {{ formatFullDate(day.date) }}
              </h2>
            </div>
            <span class="text-xs tabular-nums text-neutral-500">
              {{ day.leaves.length + day.holidays.length }}
              {{ day.leaves.length + day.holidays.length === 1 ? 'event' : 'events' }}
            </span>
          </div>

          @if (day.leaves.length === 0 && day.holidays.length === 0) {
            <app-mobile-empty-state
              icon="calendar"
              title="Nothing scheduled"
              subtitle="Everyone's at work today."
            />
          } @else {
            <div class="space-y-2.5">
              @for (holiday of day.holidays; track holiday.id) {
                <div class="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                  <div class="flex">
                    <div class="w-1.5 shrink-0 bg-violet-500"></div>
                    <div class="flex flex-1 items-center gap-3 p-4 min-w-0">
                      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 shrink-0">
                        <z-icon zType="calendar" zSize="sm"></z-icon>
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">{{ holiday.name }}</p>
                        <p class="mt-0.5 text-xs text-neutral-500">Public holiday</p>
                      </div>
                      <span class="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 shrink-0">
                        Holiday
                      </span>
                    </div>
                  </div>
                </div>
              }
              @for (leave of day.leaves; track leave.id) {
                <div class="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                  <div class="flex">
                    <div class="w-1.5 shrink-0" [style.background-color]="leaveColor(leave)"></div>
                    <div class="flex-1 p-4 min-w-0">
                      <div class="flex items-start gap-3">
                        <div
                          class="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
                          [style.background-color]="leaveColor(leave)"
                        >
                          {{ initials(leave.employee?.full_name) }}
                        </div>
                        <div class="min-w-0 flex-1">
                          <div class="flex items-start justify-between gap-2">
                            <p class="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                              {{ leave.employee?.full_name || 'Employee' }}
                            </p>
                            <span
                              class="rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0"
                              [class]="statusChip(leave.status)"
                            >
                              {{ leave.status }}
                            </span>
                          </div>
                          <div class="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span
                              class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                              [style.background-color]="leaveColor(leave) + '22'"
                              [style.color]="leaveColor(leave)"
                            >
                              <span class="h-1 w-1 rounded-full" [style.background-color]="leaveColor(leave)"></span>
                              {{ stripLeave(leave.leave_type?.name || 'Leave') }}
                            </span>
                            <span class="text-[11px] text-neutral-500">· {{ formatDuration(leave) }}</span>
                          </div>
                          <p class="mt-1.5 text-[11px] text-neutral-500">
                            <z-icon zType="calendar" zSize="sm" class="inline-block h-3 w-3 mr-1 align-[-2px] opacity-60"></z-icon>
                            {{ formatDateRange(leave.start_date, leave.end_date) }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileLeaveCalendarComponent implements OnInit {
  private leaveService = inject(LeaveService);

  readonly currentYear = signal(new Date().getFullYear());
  readonly currentMonth = signal(new Date().getMonth() + 1);
  readonly leaves = signal<Leave[]>([]);
  readonly holidays = signal<PublicHoliday[]>([]);
  readonly loading = signal(false);
  readonly selectedDay = signal<CalendarDay | null>(null);

  readonly weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  readonly skeletonCells = Array.from({ length: 42 });

  readonly monthName = computed(() => {
    const d = new Date(this.currentYear(), this.currentMonth() - 1, 1);
    return d.toLocaleString('default', { month: 'long' });
  });

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const year = this.currentYear();
    const month = this.currentMonth() - 1;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1; // Monday-first
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push(this.toCalendarDay(d, false, today));
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(this.toCalendarDay(new Date(year, month, d), true, today));
    }
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push(this.toCalendarDay(new Date(year, month + 1, d), false, today));
    }
    return days;
  });

  readonly approvedCount = computed(
    () => this.leaves().filter((l) => l.status === LeaveStatus.APPROVED).length,
  );
  readonly pendingCount = computed(
    () => this.leaves().filter((l) => l.status === LeaveStatus.PENDING).length,
  );

  readonly legendItems = computed<{ label: string; color: string }[]>(() => {
    const items: { label: string; color: string }[] = [];
    if (this.holidays().length > 0) {
      items.push({ label: 'Public Holiday', color: HOLIDAY_COLOR });
    }
    const seen = new Set<string>();
    for (const l of this.leaves()) {
      const name = l.leave_type?.name;
      if (name && !seen.has(name)) {
        seen.add(name);
        items.push({ label: name, color: LEAVE_TYPE_COLORS[name] || '#6366f1' });
      }
    }
    return items;
  });

  ngOnInit(): void {
    this.loadCalendar();
  }

  loadCalendar(): void {
    this.loading.set(true);
    this.leaveService.getLeaveCalendar(this.currentYear(), this.currentMonth()).subscribe({
      next: (res) => {
        if (res.success) {
          this.leaves.set(res.data.leaves || []);
          this.holidays.set(res.data.holidays || []);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  previousMonth(): void {
    if (this.currentMonth() === 1) {
      this.currentMonth.set(12);
      this.currentYear.set(this.currentYear() - 1);
    } else {
      this.currentMonth.set(this.currentMonth() - 1);
    }
    this.selectedDay.set(null);
    this.loadCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth() === 12) {
      this.currentMonth.set(1);
      this.currentYear.set(this.currentYear() + 1);
    } else {
      this.currentMonth.set(this.currentMonth() + 1);
    }
    this.selectedDay.set(null);
    this.loadCalendar();
  }

  goToToday(): void {
    const t = new Date();
    this.currentYear.set(t.getFullYear());
    this.currentMonth.set(t.getMonth() + 1);
    this.selectedDay.set(null);
    this.loadCalendar();
  }

  selectDay(day: CalendarDay): void {
    if (!day.isCurrentMonth) return;
    this.selectedDay.set(day);
  }

  dotsFor(day: CalendarDay): string[] {
    const colors: string[] = [];
    for (const h of day.holidays) {
      colors.push(HOLIDAY_COLOR);
      if (colors.length >= 3) return colors;
    }
    for (const l of day.leaves) {
      const c = LEAVE_TYPE_COLORS[l.leave_type?.name || ''] || '#6366f1';
      colors.push(c);
      if (colors.length >= 3) break;
    }
    return colors;
  }

  extraFor(day: CalendarDay): number {
    const total = day.leaves.length + day.holidays.length;
    return Math.max(0, total - 3);
  }

  leaveColor(l: Leave): string {
    return LEAVE_TYPE_COLORS[l.leave_type?.name || ''] || '#6366f1';
  }

  initials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  }

  statusChip(status: string): string {
    // Match web leave-calendar colors.
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'Pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'Rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      default:
        return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
    }
  }

  stripLeave(name: string): string {
    return name.replace(/\s*Leave$/i, '').trim() || name;
  }

  numberClass(day: CalendarDay): string {
    const selected = this.selectedDay();
    const isSelected =
      !!selected && selected.date.getTime() === day.date.getTime() && day.isCurrentMonth;
    if (isSelected) return 'bg-violet-600 text-white shadow-md';
    if (day.isToday) return 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300';
    if (!day.isCurrentMonth) return 'text-neutral-300 dark:text-neutral-700';
    if (day.isWeekend) return 'text-neutral-400';
    return 'text-neutral-700 dark:text-neutral-200 group-active:bg-neutral-100 dark:group-active:bg-neutral-800';
  }

  formatDuration(l: Leave): string {
    if (l.is_half_day) return `Half day (${l.half_day_period})`;
    return l.total_days === 1 ? '1 day' : `${l.total_days} days`;
  }

  formatFullDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  dayLabel(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    if (diff === 0) return `Today · ${weekday}`;
    if (diff === 1) return `Tomorrow · ${weekday}`;
    if (diff === -1) return `Yesterday · ${weekday}`;
    return weekday;
  }

  formatDateRange(startDate: string, endDate: string): string {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    if (s.getTime() === e.getTime()) return fmt(s);
    return `${fmt(s)} – ${fmt(e)}`;
  }

  private toCalendarDay(date: Date, isCurrentMonth: boolean, today: Date): CalendarDay {
    const dateStr = this.toDateString(date);
    const dow = date.getDay();
    return {
      date,
      day: date.getDate(),
      isCurrentMonth,
      isToday: date.getTime() === today.getTime(),
      isWeekend: dow === 0 || dow === 6,
      leaves: isCurrentMonth ? this.leavesOnDate(dateStr) : [],
      holidays: isCurrentMonth ? this.holidaysOnDate(dateStr) : [],
    };
  }

  private leavesOnDate(dateStr: string): Leave[] {
    return this.leaves().filter((l) => dateStr >= l.start_date && dateStr <= l.end_date);
  }

  private holidaysOnDate(dateStr: string): PublicHoliday[] {
    return this.holidays().filter((h) => h.date === dateStr);
  }

  private toDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
