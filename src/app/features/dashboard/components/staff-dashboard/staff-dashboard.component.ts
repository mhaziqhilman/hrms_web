import { Component, OnInit, OnDestroy, inject, signal, computed, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HighchartsChartComponent } from 'highcharts-angular';
import type { Options } from 'highcharts';

// ZardUI Components
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { AppDatePipe, AppTimePipe } from '@/shared/pipes/app-date.pipe';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { ZardDialogService } from '@/shared/components/dialog/dialog.service';

import { AuthService } from '@/core/services/auth.service';
import { ThemeService } from '@/core/services/theme';
import { DashboardService, StaffDashboardData } from '../../services/dashboard.service';
import { AttendanceDialogComponent } from '@/features/attendance/components/attendance-dialog/attendance-dialog.component';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HighchartsChartComponent,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardEmptyComponent,
    ZardSkeletonComponent,
    AppDatePipe,
    AppTimePipe
  ],
  templateUrl: './staff-dashboard.component.html',
  styleUrls: ['./staff-dashboard.component.css']
})
export class StaffDashboardComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private dialogService = inject(ZardDialogService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private timerInterval: any;

  isDark = this.themeService.darkMode;

  loading = signal(true);
  error = signal<string | null>(null);
  hasProfile = signal(false);

  currentTime = signal(new Date());
  isClockedIn = false;
  clockInTime: Date | null = null;
  workingHours = signal('0h 00m');

  leaveBalance = signal<StaffDashboardData['leaveBalance']>([]);
  attendanceHistory: StaffDashboardData['attendanceHistory'] = [];
  myClaims: StaffDashboardData['myClaims'] = [];
  recentMemos: StaffDashboardData['recentMemos'] = [];
  upcomingLeaves: StaffDashboardData['upcomingLeaves'] = [];
  nextPublicHoliday: StaffDashboardData['nextPublicHoliday'] = null;

  /** Selected leave type — drives pie chart highlight + center title swap */
  selectedLeaveType = signal<string | null>(null);

  ngOnInit(): void {
    // Check if user has an employee profile
    const user = this.authService.getCurrentUserValue();
    if (user?.employee) {
      this.hasProfile.set(true);
      this.loadDashboard();
    } else {
      // Refresh from API to get latest user data (employee may have been created)
      this.authService.getCurrentUser().subscribe({
        next: (res) => {
          if (res.success && res.data?.employee) {
            this.hasProfile.set(true);
            this.loadDashboard();
          } else {
            this.hasProfile.set(false);
            this.loading.set(false);
          }
        },
        error: () => {
          this.hasProfile.set(false);
          this.loading.set(false);
        }
      });
    }

    // Update time every second — outside Angular zone so the tick doesn't
    // trigger global CD; signal writes still notify their consumers normally.
    this.ngZone.runOutsideAngular(() => {
      this.timerInterval = setInterval(() => {
        const now = new Date();
        this.currentTime.set(now);
        if (this.isClockedIn && this.clockInTime) {
          const diff = now.getTime() - this.clockInTime.getTime();
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          this.workingHours.set(`${hours}h ${minutes.toString().padStart(2, '0')}m`);
        }
      }, 1000);
    });
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardService.getStaffDashboard().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const d = response.data;

          // Set clock in/out status from today's attendance
          if (d.todayAttendance) {
            this.isClockedIn = d.todayAttendance.isClockedIn;
            this.clockInTime = d.todayAttendance.clockInTime ? new Date(d.todayAttendance.clockInTime) : null;
          }

          this.leaveBalance.set(d.leaveBalance || []);
          this.attendanceHistory = d.attendanceHistory;
          this.myClaims = d.myClaims;
          this.upcomingLeaves = d.upcomingLeaves;
          this.recentMemos = d.recentMemos;
          this.nextPublicHoliday = d.nextPublicHoliday ?? null;
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load staff dashboard:', err);
        this.error.set('Failed to load dashboard data. Please try again.');
        this.loading.set(false);
      }
    });
  }

  clockIn(): void {
    this.openAttendanceDialog();
  }

  clockOut(): void {
    this.openAttendanceDialog();
  }

  private openAttendanceDialog(): void {
    this.dialogService.create({
      zContent: AttendanceDialogComponent,
      zHideFooter: true,
      zClosable: false,
      zWidth: '800px',
      zCustomClasses: 'p-0 gap-0 md:overflow-hidden max-md:!w-[calc(100vw-1.5rem)] max-md:!max-w-[calc(100vw-1.5rem)]',
      zData: {
        onSuccess: () => this.loadDashboard()
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'On Time': 'badge-light-success',
      'Late': 'badge-light-warning',
      'Early Leave': 'badge-light-info',
      'WFH': 'badge-light-info',
      'Pending': 'badge-light-warning',
      'Approved': 'badge-light-success',
      'Rejected': 'badge-light-danger',
      'Paid': 'badge-light-primary',
      'Manager_Approved': 'badge-light-info',
      'Finance_Approved': 'badge-light-success'
    };
    return statusMap[status] || 'badge-light-secondary';
  }

  getProgressPercentage(leave: any): number {
    if (leave.total === 0) return 0;
    return ((leave.used + leave.pending) / leave.total) * 100;
  }

  getUnreadMemosCount(): number {
    return this.recentMemos.filter(m => !m.read).length;
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /** Go to the leave list page and trigger the Apply Leave sheet via query param */
  openApplyLeave(): void {
    this.router.navigate(['/leave/list'], { queryParams: { action: 'apply' } });
  }

  // ─── Variant 02 (Hero leave + sticky feed) helpers ─────────────────────────────────

  readonly currentFY = new Date().getFullYear();

  /** Leave types displayed (Unpaid Leave is excluded from chart + cards) */
  filteredLeaveBalance = computed(() =>
    this.leaveBalance().filter(l => !/unpaid/i.test(l.type))
  );

  /** Total available days summed across the displayed leave types */
  totalAvailable = computed(() =>
    this.filteredLeaveBalance().reduce((sum, l) => sum + Math.max(0, l.available), 0)
  );

  /** Currently-selected leave (or null when showing aggregate total) */
  selectedLeave = computed<StaffDashboardData['leaveBalance'][number] | null>(() => {
    const t = this.selectedLeaveType();
    if (!t) return null;
    return this.filteredLeaveBalance().find(l => l.type === t) || null;
  });

  /** Used / Pending / Entitled — aggregate when nothing selected, single-type values when one is selected */
  displayStats = computed<{ used: number; pending: number; total: number }>(() => {
    const sel = this.selectedLeave();
    if (sel) return { used: sel.used, pending: sel.pending, total: sel.total };
    const rows = this.filteredLeaveBalance();
    return {
      used: rows.reduce((s, l) => s + (l.used || 0), 0),
      pending: rows.reduce((s, l) => s + (l.pending || 0), 0),
      total: rows.reduce((s, l) => s + (l.total || 0), 0)
    };
  });

  selectLeaveType(type: string): void {
    this.selectedLeaveType.set(this.selectedLeaveType() === type ? null : type);
  }

  /** Highcharts donut — slices sized by days available per leave type */
  leavePieChartOptions = computed<Options>(() => {
    const rows = this.filteredLeaveBalance();
    const dark = this.isDark();
    const selectedType = this.selectedLeaveType();
    const onSelect = (t: string) => this.selectLeaveType(t);

    const labelColor = dark ? '#cbd5e1' : '#64748b';
    const titleColor = dark ? '#f1f5f9' : '#0f172a';
    const subtitleColor = dark ? '#94a3b8' : '#94a3b8';
    const tooltipBg = dark ? '#0f172a' : '#fff';
    const tooltipText = dark ? '#e2e8f0' : '#0f172a';
    // Distinct palette — same aesthetic as admin dashboard
    const palette = ['#0d9488', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#10b981', '#ec4899', '#64748b'];

    const sel = selectedType ? rows.find(r => r.type === selectedType) : null;
    const heroValue = sel ? Math.max(0, sel.available) : rows.reduce((s, r) => s + Math.max(0, r.available), 0);
    // Strip trailing " Leave" so center reads "Annual" / "Emergency" / "Medical" instead of "Annual Leave"
    const heroLabel = sel ? sel.type.replace(/\s*leave\s*$/i, '').trim() || sel.type : 'Total';
    const subLabel = sel ? `of ${sel.total} entitled` : 'Days available';

    // Dim non-selected slices when a selection is active (hex alpha "33" ≈ 20%)
    const data = rows.map((r, i) => {
      const isSelected = r.type === selectedType;
      const baseColor = palette[i % palette.length];
      const dimmed = selectedType && !isSelected;
      return {
        name: r.type,
        y: Math.max(0, r.available),
        sliced: isSelected,
        selected: isSelected,
        color: dimmed ? baseColor + '33' : baseColor
      };
    });

    return {
      chart: {
        type: 'pie',
        backgroundColor: 'transparent',
        height: 220,
        style: { fontFamily: 'inherit' },
        spacing: [0, 0, 0, 0],
        marginTop: 0,
        marginBottom: 0,
        events: {
          render: function () {
            const c = this as any;
            const series = c.series && c.series[0];
            if (!series || !series.center || !c.title) return;
            const [cx, cy] = series.center;
            const titleEl = c.title.element as HTMLElement | undefined;
            if (!titleEl) return;
            const w = (titleEl as any).offsetWidth || titleEl.getBoundingClientRect().width || 90;
            const h = (titleEl as any).offsetHeight || titleEl.getBoundingClientRect().height || 60;
            titleEl.style.left = `${cx + c.plotLeft - w / 2}px`;
            titleEl.style.top = `${cy + c.plotTop - h / 2}px`;
          }
        }
      },
      title: {
        text: `<div style="text-align:center;line-height:1.15">
                 <div style="color:${subtitleColor};font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase">${heroLabel}</div>
                 <div style="color:${titleColor};font-size:34px;font-weight:600;letter-spacing:-0.01em;margin-top:4px">${heroValue}</div>
                 <div style="color:${subtitleColor};font-size:11px;font-weight:500;margin-top:6px">${subLabel}</div>
               </div>`,
        useHTML: true,
        floating: true,
        align: 'left',
        verticalAlign: 'top',
        x: 0,
        y: 0
      },
      credits: { enabled: false },
      accessibility: { enabled: false },
      legend: { enabled: false },
      tooltip: {
        backgroundColor: tooltipBg,
        style: { color: tooltipText, fontSize: '11px' },
        borderWidth: 1,
        borderRadius: 8,
        useHTML: true,
        headerFormat: '<div style="font-size:11px;font-weight:600;margin-bottom:2px">{point.key}</div>',
        pointFormat: '<div style="font-size:12px"><b>{point.y}</b> day(s) · {point.percentage:.1f}%</div>'
      },
      plotOptions: {
        pie: {
          size: '92%',
          innerSize: '75%',
          center: ['50%', '50%'],
          borderWidth: 3,
          borderColor: dark ? '#0b1220' : '#ffffff',
          dataLabels: { enabled: false },
          colors: palette,
          cursor: 'pointer',
          point: {
            events: {
              click: function () {
                onSelect((this as any).name);
              }
            }
          },
          states: {
            hover: { brightness: 0.06, halo: { size: 6, opacity: 0.15 } },
            inactive: { opacity: 1 }
          }
        }
      },
      series: [{ type: 'pie', name: 'Leave', data }]
    };
  });

  // ── Next public holiday helpers ──
  getHolidayMonth(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short' });
  }
  getHolidayDay(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(`${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return '';
    return String(d.getDate()).padStart(2, '0');
  }
  getHolidayDaysAwayLabel(daysAway: number): string {
    if (daysAway === 0) return 'Today';
    if (daysAway === 1) return 'Tomorrow';
    return `${daysAway} days away`;
  }

  /** Color swatch matching pie chart slice — derived from card index in displayed leaves */
  getLeaveSliceColor(type: string): string {
    const palette = ['#0d9488', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#10b981', '#ec4899', '#64748b'];
    const idx = this.filteredLeaveBalance().findIndex(l => l.type === type);
    return idx >= 0 ? palette[idx % palette.length] : '#64748b';
  }

  /** Compact leave card states: amber for low (<= 50% w/ small total), rose for negative */
  private isLeaveOver(leave: StaffDashboardData['leaveBalance'][number]): boolean {
    return leave.available < 0;
  }
  private isLeaveLow(leave: StaffDashboardData['leaveBalance'][number]): boolean {
    return !this.isLeaveOver(leave) && leave.total > 0 && leave.total <= 5;
  }

  getLeaveCardClass(leave: StaffDashboardData['leaveBalance'][number]): string {
    if (this.isLeaveOver(leave)) return 'border-rose-200 dark:border-rose-500/30 bg-rose-50/40 dark:bg-rose-500/5';
    if (this.isLeaveLow(leave)) return 'border-amber-200 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-500/5';
    return 'border-border';
  }
  getLeaveCardTextClass(leave: StaffDashboardData['leaveBalance'][number]): string {
    if (this.isLeaveOver(leave)) return 'text-rose-700 dark:text-rose-300';
    if (this.isLeaveLow(leave)) return 'text-amber-700 dark:text-amber-300';
    return 'text-foreground';
  }
  getLeaveCardValueClass(leave: StaffDashboardData['leaveBalance'][number]): string {
    if (this.isLeaveOver(leave)) return 'text-rose-600 dark:text-rose-400';
    if (this.isLeaveLow(leave)) return 'text-amber-700 dark:text-amber-300';
    return 'text-foreground';
  }
  getLeaveBarTrackClass(leave: StaffDashboardData['leaveBalance'][number]): string {
    if (this.isLeaveOver(leave)) return 'bg-rose-100 dark:bg-rose-500/15';
    if (this.isLeaveLow(leave)) return 'bg-amber-100 dark:bg-amber-500/15';
    return 'bg-muted';
  }
  getLeaveBarFillClass(leave: StaffDashboardData['leaveBalance'][number]): string {
    if (this.isLeaveOver(leave)) return 'bg-rose-500';
    if (this.isLeaveLow(leave)) return 'bg-amber-500';
    return 'bg-foreground';
  }

  /** Inline bar color — slice color by default, overridden to amber/rose for low/over states */
  getLeaveBarColor(leave: StaffDashboardData['leaveBalance'][number]): string {
    if (this.isLeaveOver(leave)) return '#ef4444';   // rose-500
    if (this.isLeaveLow(leave)) return '#f59e0b';    // amber-500
    return this.getLeaveSliceColor(leave.type);
  }
  getLeaveBarPercent(leave: StaffDashboardData['leaveBalance'][number]): number {
    if (this.isLeaveOver(leave)) return 100;
    if (!leave.total) return 0;
    return Math.max(0, Math.min(100, (leave.available / leave.total) * 100));
  }
  getLeaveCardCaption(leave: StaffDashboardData['leaveBalance'][number]): string {
    if (this.isLeaveOver(leave)) return `Over by ${Math.abs(leave.available)} day${Math.abs(leave.available) === 1 ? '' : 's'}`;
    return `${leave.total} / ${leave.total} · ${leave.used} used`;
  }
  getLeaveCardCaptionClass(leave: StaffDashboardData['leaveBalance'][number]): string {
    if (this.isLeaveOver(leave)) return 'text-rose-700/80 dark:text-rose-400/80';
    if (this.isLeaveLow(leave)) return 'text-amber-700/80 dark:text-amber-400/80';
    return 'text-muted-foreground';
  }
  formatLeaveValue(v: number): string {
    return v < 0 ? `−${Math.abs(v)}` : `${v}`;
  }

  // ── Attendance heatmap (30-day punctuality) ──
  getHeatmapCells(): { kind: 'on-time' | 'late' | 'wfh' | 'off' | 'weekend'; date: string }[] {
    const cells: { kind: 'on-time' | 'late' | 'wfh' | 'off' | 'weekend'; date: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build a quick lookup keyed by the date string emitted by the API.
    // The backend formats as YYYY-MM-DD (zero-padded), so match exactly.
    const lookup = new Map<string, string>();
    for (const a of this.attendanceHistory) {
      if (a.date) lookup.set(a.date, a.status || '');
    }

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dow = d.getDay();
      const isWeekend = dow === 0 || dow === 6;

      const status = lookup.get(ymd);
      let kind: 'on-time' | 'late' | 'wfh' | 'off' | 'weekend';
      if (status) {
        const s = status.toLowerCase();
        if (s.includes('late')) kind = 'late';
        else if (s === 'wfh') kind = 'wfh';
        else if (s.includes('on time') || s.includes('present')) kind = 'on-time';
        else kind = 'off';
      } else if (isWeekend) {
        kind = 'weekend';
      } else {
        kind = 'off';
      }
      cells.push({ kind, date: ymd });
    }
    return cells;
  }

  getHeatmapCellClass(kind: string): string {
    switch (kind) {
      case 'on-time': return 'bg-emerald-400 dark:bg-emerald-500/70';
      case 'late': return 'bg-amber-400 dark:bg-amber-500/70';
      case 'wfh': return 'bg-indigo-400 dark:bg-indigo-500/70';
      case 'weekend': return 'bg-slate-100 dark:bg-slate-800/60';
      default: return 'bg-slate-200 dark:bg-slate-700/40';
    }
  }

  getLateCount(): number {
    return this.attendanceHistory.filter(a => /late/i.test(a.status || '')).length;
  }

  // ── Attendance row pills ──
  getAttendanceStatusClass(status: string): string {
    switch (status) {
      case 'On Time':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-500/30';
      case 'WFH':
        return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-500/30';
      case 'Late':
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-500/30';
      case 'Early Leave':
        return 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-1 ring-sky-200 dark:ring-sky-500/30';
      default:
        return 'bg-slate-100 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-500/30';
    }
  }
  getAttendanceDotClass(status: string): string {
    switch (status) {
      case 'On Time': return 'bg-emerald-500';
      case 'WFH': return 'bg-indigo-500';
      case 'Late': return 'bg-amber-500';
      case 'Early Leave': return 'bg-sky-500';
      default: return 'bg-slate-400 dark:bg-slate-500';
    }
  }

  // ── My Claims — text status label ──
  getClaimStatusTextClass(status: string): string {
    switch (status) {
      case 'Approved':
      case 'Finance_Approved':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'Paid':
        return 'text-sky-600 dark:text-sky-400';
      case 'Rejected':
        return 'text-rose-600 dark:text-rose-400';
      default:
        return 'text-amber-600 dark:text-amber-400';
    }
  }

  // ── Upcoming leave row pills ──
  getLeaveStatusClass(status: string): string {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-500/30';
      case 'Rejected':
        return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-500/30';
      default:
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-500/30';
    }
  }
  getLeaveStatusDotClass(status: string): string {
    switch (status) {
      case 'Approved': return 'bg-emerald-500';
      case 'Rejected': return 'bg-rose-500';
      default: return 'bg-amber-500';
    }
  }

  // ── Memo time-ago for sticky announcements rail ──
  getMemoTimeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    if (diffDays < 30) {
      const w = Math.floor(diffDays / 7);
      return `${w} week${w === 1 ? '' : 's'} ago`;
    }
    if (diffDays < 365) {
      const m = Math.floor(diffDays / 30);
      return `${m} month${m === 1 ? '' : 's'} ago`;
    }
    const y = Math.floor(diffDays / 365);
    return `${y} year${y === 1 ? '' : 's'} ago`;
  }
}
