import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LeaveService } from '../../services/leave.service';
import { AuthService } from '@/core/services/auth.service';
import {
  Leave,
  LeaveType,
  PublicHoliday,
  CalendarDay,
  LeaveStatus,
  LEAVE_TYPE_COLORS
} from '../../models/leave.model';

import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-leave-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardTooltipModule,
    ZardSkeletonComponent
  ],
  templateUrl: './leave-calendar.component.html',
  styleUrl: './leave-calendar.component.css'
})
export class LeaveCalendarComponent implements OnInit {
  private leaveService = inject(LeaveService);
  private authService = inject(AuthService);

  // State
  currentYear = signal(new Date().getFullYear());
  currentMonth = signal(new Date().getMonth() + 1);
  leaves = signal<Leave[]>([]);
  holidays = signal<PublicHoliday[]>([]);
  leaveTypes = signal<LeaveType[]>([]);
  loading = signal(false);
  selectedDay = signal<CalendarDay | null>(null);
  showAllEvents = signal(true);

  // Computed
  monthName = computed(() => {
    const date = new Date(this.currentYear(), this.currentMonth() - 1, 1);
    return date.toLocaleString('default', { month: 'long' });
  });

  calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth() - 1;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday = 0, Sunday = 6
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push(this.createCalendarDay(date, false, today));
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push(this.createCalendarDay(date, true, today));
    }

    // Next month padding (fill to 42 for 6 rows)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      days.push(this.createCalendarDay(date, false, today));
    }

    return days;
  });

  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Legend items
  legendItems = computed(() => {
    const uniqueTypes = new Set<string>();
    this.leaves().forEach(l => {
      if (l.leave_type?.name) uniqueTypes.add(l.leave_type.name);
    });

    const items: { label: string; color: string }[] = [];

    if (this.holidays().length > 0) {
      items.push({ label: 'Public Holiday', color: '#a855f7' });
    }

    uniqueTypes.forEach(name => {
      items.push({ label: name, color: this.getLeaveTypeColor(name) });
    });

    return items;
  });

  // Summary stats for selected day
  selectedDayApproved = computed(() => {
    const day = this.selectedDay();
    if (!day) return [];
    return day.leaves.filter(l => l.status === LeaveStatus.APPROVED);
  });

  selectedDayPending = computed(() => {
    const day = this.selectedDay();
    if (!day) return [];
    return day.leaves.filter(l => l.status === LeaveStatus.PENDING);
  });

  ngOnInit(): void {
    this.loadCalendarData();
    this.loadLeaveTypes();
  }

  loadCalendarData(): void {
    this.loading.set(true);
    this.leaveService.getLeaveCalendar(this.currentYear(), this.currentMonth()).subscribe({
      next: (res) => {
        if (res.success) {
          this.leaves.set(res.data.leaves);
          this.holidays.set(res.data.holidays);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadLeaveTypes(): void {
    this.leaveService.getLeaveTypes().subscribe({
      next: (res) => {
        if (res.success) {
          this.leaveTypes.set(res.data ?? []);
        }
      }
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
    this.loadCalendarData();
  }

  nextMonth(): void {
    if (this.currentMonth() === 12) {
      this.currentMonth.set(1);
      this.currentYear.set(this.currentYear() + 1);
    } else {
      this.currentMonth.set(this.currentMonth() + 1);
    }
    this.selectedDay.set(null);
    this.loadCalendarData();
  }

  goToToday(): void {
    const today = new Date();
    this.currentYear.set(today.getFullYear());
    this.currentMonth.set(today.getMonth() + 1);
    this.selectedDay.set(null);
    this.loadCalendarData();
  }

  selectDay(day: CalendarDay): void {
    if (!day.isCurrentMonth) return;
    this.selectedDay.set(day);
  }

  toggleShowAllEvents(): void {
    this.showAllEvents.set(!this.showAllEvents());
  }

  getLeaveTypeColor(typeName: string): string {
    return LEAVE_TYPE_COLORS[typeName] || '#6366f1';
  }

  getStatusBadgeType(status: string): string {
    switch (status) {
      case 'Approved': return 'default';
      case 'Pending': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  }

  getDayEventCount(day: CalendarDay): number {
    return day.leaves.length + day.holidays.length;
  }

  getMaxDotsToShow(): number {
    return 3;
  }

  getExtraCount(day: CalendarDay): number {
    const total = day.leaves.length + day.holidays.length;
    return Math.max(0, total - this.getMaxDotsToShow());
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  formatFullDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getLeaveBreakdown(day: CalendarDay): { name: string; color: string; count: number }[] {
    const map = new Map<string, number>();
    day.leaves.forEach(l => {
      const name = l.leave_type?.name || 'Other';
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      color: this.getLeaveTypeColor(name),
      count
    }));
  }

  getMonthlyApprovedCount(): number {
    return this.leaves().filter(l => l.status === LeaveStatus.APPROVED).length;
  }

  getMonthlyPendingCount(): number {
    return this.leaves().filter(l => l.status === LeaveStatus.PENDING).length;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  formatShortDate(date: Date): string {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
  }

  formatDayLabel(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    if (diff === 0) return `Today - ${weekday}`;
    if (diff === 1) return `Tomorrow - ${weekday}`;
    if (diff === -1) return `Yesterday - ${weekday}`;
    return weekday;
  }

  stripLeave(name: string): string {
    return name.replace(/\s*Leave$/i, '').trim();
  }

  formatDuration(leave: Leave): string {
    if (leave.is_half_day) return `Half day (${leave.half_day_period})`;
    const days = leave.total_days;
    if (days === 1) return '1 day';
    return `${days} days`;
  }

  formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start.getTime() === end.getTime()) {
      return this.formatDate(startDate);
    }
    return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
  }

  private createCalendarDay(date: Date, isCurrentMonth: boolean, today: Date): CalendarDay {
    const dateStr = this.toDateString(date);
    const dayOfWeek = date.getDay();

    return {
      date,
      day: date.getDate(),
      isCurrentMonth,
      isToday: date.getTime() === today.getTime(),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      leaves: isCurrentMonth ? this.getLeavesForDate(dateStr) : [],
      holidays: isCurrentMonth ? this.getHolidaysForDate(dateStr) : []
    };
  }

  private getLeavesForDate(dateStr: string): Leave[] {
    return this.leaves().filter(leave => {
      return dateStr >= leave.start_date && dateStr <= leave.end_date;
    });
  }

  private getHolidaysForDate(dateStr: string): PublicHoliday[] {
    return this.holidays().filter(h => h.date === dateStr);
  }

  private toDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
