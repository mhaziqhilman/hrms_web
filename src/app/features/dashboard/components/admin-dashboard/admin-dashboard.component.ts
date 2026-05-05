import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HighchartsChartComponent } from 'highcharts-angular';
import type { Options } from 'highcharts';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardTabGroupComponent, ZardTabComponent } from '@/shared/components/tabs/tabs.component';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';

import { AuthService } from '@/core/services/auth.service';
import { ThemeService } from '@/core/services/theme';
import { DashboardService, AdminDashboardData } from '../../services/dashboard.service';
import { StaffDashboardComponent } from '../staff-dashboard/staff-dashboard.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HighchartsChartComponent,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardTabGroupComponent,
    ZardTabComponent,
    ZardSkeletonComponent,
    StaffDashboardComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private router = inject(Router);

  isDark = this.themeService.darkMode;

  loading = signal(true);
  error = signal<string | null>(null);
  activeTab = 0;

  payrollSummary = {
    status: '-',
    totalEmployees: 0,
    totalGrossSalary: 0,
    totalStatutory: 0,
    totalPCB: 0,
    totalNetSalary: 0
  };

  employeeStats = {
    totalEmployees: 0,
    activeEmployees: 0,
    onLeave: 0,
    newHires: 0
  };

  attendanceSummary = {
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    wfhToday: 0,
    attendanceRate: 0
  };

  claimsPendingPayment: AdminDashboardData['claimsPendingPayment'] = [];
  recentLeaveRequests: AdminDashboardData['recentLeaveRequests'] = [];
  recentActivities: AdminDashboardData['recentActivities'] = [];

  employeeByType = signal<AdminDashboardData['employeeByType']>([]);
  genderDiversity = signal<AdminDashboardData['genderDiversity']>([]);
  departmentDistribution = signal<AdminDashboardData['departmentDistribution']>([]);
  payrollTrend = signal<AdminDashboardData['payrollTrend']>([]);

  lastUpdated = '';
  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();

  userName = '';

  // ─── Chart options (Highcharts) ────────────────────────────────────────────

  deptChartOptions = computed<Options>(() => {
    const rows = this.departmentDistribution();
    const dark = this.isDark();
    const gridLine = dark ? '#1f2937' : 'rgba(148,163,184,0.1)';
    const axisLine = dark ? '#334155' : '#e2e8f0';
    const labelColor = dark ? '#cbd5e1' : '#94a3b8';
    const tooltipBg = dark ? '#0f172a' : '#fff';
    const tooltipText = dark ? '#e2e8f0' : '#0f172a';
    const palette = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#a7f3d0', '#6ee7b7', '#34d399'];

    return {
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
        height: 160,
        style: { fontFamily: 'inherit' },
        spacing: [4, 4, 0, 0],
        marginBottom: 28
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },
      accessibility: { enabled: false },
      xAxis: {
        categories: rows.map(d => d.department),
        lineColor: axisLine,
        tickLength: 0,
        labels: {
          style: { color: labelColor, fontSize: '11px' },
          y: 14,
          autoRotation: [-20]
        }
      },
      yAxis: {
        title: { text: undefined },
        gridLineColor: gridLine,
        gridLineDashStyle: 'Dash',
        allowDecimals: false,
        tickInterval: 1,
        labels: { style: { color: labelColor, fontSize: '11px' } }
      },
      tooltip: {
        backgroundColor: tooltipBg,
        style: { color: tooltipText },
        borderWidth: 1,
        borderRadius: 8,
        useHTML: true,
        headerFormat: '<div style="font-size:11px;font-weight:600;margin-bottom:2px">{point.key}</div>',
        pointFormat: '<div style="font-size:12px"><b>{point.y}</b> employee(s)</div>'
      },
      plotOptions: {
        column: {
          borderRadius: 5,
          borderWidth: 0,
          pointPadding: 0.25,
          groupPadding: 0.2,
          maxPointWidth: 56,
          colorByPoint: true,
          colors: palette,
          states: {
            hover: { brightness: 0.08 }
          }
        }
      },
      series: [{
        type: 'column',
        name: 'Employees',
        data: rows.map(d => d.count)
      }]
    };
  });

  employeeTypeChartOptions = computed<Options>(() => {
    const rows = this.employeeByType();
    const dark = this.isDark();
    const labelColor = dark ? '#cbd5e1' : '#64748b';
    const titleColor = dark ? '#f1f5f9' : '#1e293b';
    const subtitleColor = dark ? '#94a3b8' : '#94a3b8';
    const tooltipBg = dark ? '#0f172a' : '#fff';
    const tooltipText = dark ? '#e2e8f0' : '#0f172a';
    const palette = ['#0d9488', '#f59e0b', '#8b5cf6', '#ef4444'];

    const data = rows.map(e => ({ name: e.type, y: e.count }));
    const total = data.reduce((sum, d) => sum + (d.y || 0), 0);

    return {
      chart: {
        type: 'pie',
        backgroundColor: 'transparent',
        height: 165,
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
            const w = (titleEl as any).offsetWidth || titleEl.getBoundingClientRect().width || 80;
            const h = (titleEl as any).offsetHeight || titleEl.getBoundingClientRect().height || 56;
            const left = cx + c.plotLeft - w / 2;
            const top = cy + c.plotTop - h / 2;
            titleEl.style.left = `${left}px`;
            titleEl.style.top = `${top}px`;
          }
        }
      },
      title: {
        text: `<div style="text-align:center;line-height:1.15">
                 <div style="color:${subtitleColor};font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase">Total</div>
                 <div style="color:${titleColor};font-size:24px;font-weight:700;margin-top:2px">${total}</div>
                 <div style="color:${subtitleColor};font-size:10px;font-weight:500">Employees</div>
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
      legend: {
        enabled: true,
        align: 'right',
        verticalAlign: 'middle',
        layout: 'vertical',
        symbolRadius: 6,
        symbolHeight: 8,
        symbolPadding: 6,
        itemStyle: { color: labelColor, fontSize: '12px', fontWeight: '500' },
        itemDistance: 16,
        itemMarginTop: 0,
        itemMarginBottom: 5,
        margin: 8,
        padding: 10,
        y: 0
      },
      tooltip: {
        backgroundColor: tooltipBg,
        style: { color: tooltipText },
        borderWidth: 1,
        borderRadius: 8,
        useHTML: true,
        headerFormat: '<div style="font-size:11px;font-weight:600;margin-bottom:2px">{point.key}</div>',
        pointFormat: '<div style="font-size:12px"><b>{point.y}</b> · {point.percentage:.1f}%</div>'
      },
      plotOptions: {
        pie: {
          size: '92%',
          innerSize: '70%',
          center: ['50%', '50%'],
          borderWidth: 3,
          borderColor: dark ? '#0b1220' : '#ffffff',
          dataLabels: { enabled: false },
          showInLegend: true,
          colors: palette,
          states: {
            hover: { brightness: 0.06, halo: { size: 6, opacity: 0.15 } }
          }
        }
      },
      series: [{ type: 'pie', name: 'Employees', data }]
    };
  });

  ngOnInit(): void {
    const user = this.authService.getCurrentUserValue();
    this.userName = user?.employee?.full_name || user?.email || 'Admin';
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardService.getAdminDashboard().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const d = response.data;
          this.employeeStats = d.employeeStats;
          this.attendanceSummary = d.attendanceSummary;
          this.payrollSummary = d.payrollSummary;
          this.claimsPendingPayment = d.claimsPendingPayment;
          this.recentLeaveRequests = d.recentLeaveRequests;
          this.recentActivities = d.recentActivities;
          this.employeeByType.set(d.employeeByType || []);
          this.genderDiversity.set(d.genderDiversity || []);
          this.departmentDistribution.set(d.departmentDistribution || []);
          this.payrollTrend.set(d.payrollTrend || []);
          this.lastUpdated = d.lastUpdated || new Date().toISOString();
          this.currentMonth = d.currentMonth;
          this.currentYear = d.currentYear;
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load admin dashboard:', err);
        this.error.set('Failed to load dashboard data. Please try again.');
        this.loading.set(false);
      }
    });
  }

  onTabChange(event: any): void {
    this.activeTab = event.index;
  }

  getMonthName(month: number): string {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month] || '';
  }

  getClaimsTotal(): number {
    return this.claimsPendingPayment.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }

  getInitials(name: string): string {
    if (!name) return '—';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0]?.[1] || '');
    return (first + second).toUpperCase();
  }

  private readonly avatarGradients = [
    'from-indigo-400 to-indigo-600',
    'from-rose-400 to-rose-600',
    'from-emerald-400 to-emerald-600',
    'from-amber-400 to-amber-600',
    'from-violet-400 to-violet-600',
    'from-sky-400 to-sky-600'
  ];

  getAvatarGradient(idx: number): string {
    return this.avatarGradients[idx % this.avatarGradients.length];
  }

  getActivityDotClass(color: string): string {
    switch (color) {
      case 'success': return 'bg-emerald-500';
      case 'info': return 'bg-indigo-500';
      case 'primary': return 'bg-sky-500';
      case 'warning': return 'bg-amber-500';
      default: return 'bg-slate-400';
    }
  }

  getActivityRingClass(color: string): string {
    switch (color) {
      case 'success': return 'ring-emerald-100 dark:ring-emerald-500/20';
      case 'info': return 'ring-indigo-100 dark:ring-indigo-500/20';
      case 'primary': return 'ring-sky-100 dark:ring-sky-500/20';
      case 'warning': return 'ring-amber-100 dark:ring-amber-500/20';
      default: return 'ring-slate-100 dark:ring-slate-500/20';
    }
  }

  getCurrentDay(): number {
    return new Date().getDate();
  }

  getAttendancePct(kind: 'present' | 'late' | 'absent' | 'wfh'): number {
    const total = this.employeeStats.activeEmployees || 1;
    const value = {
      present: this.attendanceSummary.presentToday,
      late: this.attendanceSummary.lateToday,
      absent: this.attendanceSummary.absentToday,
      wfh: this.attendanceSummary.wfhToday
    }[kind];
    return Math.round((value / total) * 100);
  }

  // null = current month (live payrollSummary), otherwise index into payrollTrend
  selectedTrendIndex = signal<number | null>(null);

  selectedTrendItem = computed(() => {
    const idx = this.selectedTrendIndex();
    const t = this.payrollTrend();
    if (idx == null || !t[idx]) return null;
    return t[idx];
  });

  // The net to display in the hero — selected month's net, or live current-month net
  displayNetSalary = computed(() => {
    const sel = this.selectedTrendItem();
    return sel ? sel.total : this.payrollSummary.totalNetSalary;
  });

  displayGrossSalary = computed(() => {
    const sel = this.selectedTrendItem();
    return sel ? sel.gross : this.payrollSummary.totalGrossSalary;
  });

  displayStatutory = computed(() => {
    const sel = this.selectedTrendItem();
    return sel ? sel.statutory : this.payrollSummary.totalStatutory;
  });

  displayPCB = computed(() => {
    const sel = this.selectedTrendItem();
    return sel ? sel.pcb : this.payrollSummary.totalPCB;
  });

  // ─── Animated counters ─────────────────────────────────
  // Tween from previous value → target whenever a display value changes.
  // The template reads these *Animated signals; raw display* values still drive layout/comparisons.
  netSalaryAnimated = signal(0);
  grossSalaryAnimated = signal(0);
  statutoryAnimated = signal(0);
  pcbAnimated = signal(0);
  prevNetAnimated = signal(0);

  private animationFrames = new Map<string, number>();

  private animateValue(key: string, target: number, setter: (v: number) => void, current: number) {
    const existing = this.animationFrames.get(key);
    if (existing) cancelAnimationFrame(existing);

    const start = current;
    const delta = target - start;
    if (delta === 0) {
      setter(target);
      return;
    }

    const duration = 600; // ms
    const startTime = performance.now();
    // easeOutQuart for a snappy, polished feel
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const value = start + delta * easeOut(t);
      setter(value);
      if (t < 1) {
        this.animationFrames.set(key, requestAnimationFrame(tick));
      } else {
        setter(target);
        this.animationFrames.delete(key);
      }
    };

    this.animationFrames.set(key, requestAnimationFrame(tick));
  }

  constructor() {
    // Effects that react to the source computed signals and tween the displayed values
    effect(() => {
      this.animateValue('net', this.displayNetSalary(), v => this.netSalaryAnimated.set(v), this.netSalaryAnimated());
    });
    effect(() => {
      this.animateValue('gross', this.displayGrossSalary(), v => this.grossSalaryAnimated.set(v), this.grossSalaryAnimated());
    });
    effect(() => {
      this.animateValue('stat', this.displayStatutory(), v => this.statutoryAnimated.set(v), this.statutoryAnimated());
    });
    effect(() => {
      this.animateValue('pcb', this.displayPCB(), v => this.pcbAnimated.set(v), this.pcbAnimated());
    });
    effect(() => {
      this.animateValue('prevNet', this.payrollPrevNet(), v => this.prevNetAnimated.set(v), this.prevNetAnimated());
    });
  }

  formatCounter(value: number): string {
    return Math.round(value).toLocaleString();
  }

  // Label for the selected period
  displayPeriodLabel = computed(() => {
    const sel = this.selectedTrendItem();
    if (sel) return `${this.getMonthName(sel.month)} ${sel.year}`;
    return `${this.getMonthName(this.currentMonth)} ${this.currentYear}`;
  });

  // Net of the previous month relative to the selected (or current) month
  payrollPrevNet = computed(() => {
    const t = this.payrollTrend();
    if (t.length < 2) return 0;
    const idx = this.selectedTrendIndex();
    const i = idx != null ? idx : t.length - 1;
    return i > 0 ? t[i - 1].total : 0;
  });

  payrollDelta = computed(() => this.displayNetSalary() - this.payrollPrevNet());

  selectTrendIndex(idx: number) {
    const t = this.payrollTrend();
    if (idx < 0 || idx >= t.length) return;
    // Clicking the active bar twice resets to live current-month view
    this.selectedTrendIndex.set(this.selectedTrendIndex() === idx ? null : idx);
  }

  payrollTrendChartOptions = computed<Options>(() => {
    const rows = this.payrollTrend();
    const dark = this.isDark();
    const labelColor = dark ? '#94a3b8' : '#94a3b8';
    const tooltipBg = dark ? '#0f172a' : '#fff';
    const tooltipText = dark ? '#e2e8f0' : '#0f172a';
    const activeColor = '#10b981';
    const inactiveColor = dark ? '#1f2937' : '#e2e8f0';
    const selectedIdx = this.selectedTrendIndex();
    const onSelect = (i: number) => this.selectTrendIndex(i);
    const isHighlighted = (i: number, r: { isCurrent: boolean }) =>
      selectedIdx != null ? i === selectedIdx : r.isCurrent;

    return {
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
        height: 80,
        width: 200,
        margin: [4, 0, 16, 0],
        style: { fontFamily: 'inherit' }
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },
      accessibility: { enabled: false },
      xAxis: {
        categories: rows.map(r => r.label),
        lineWidth: 0,
        tickLength: 0,
        labels: { style: { color: labelColor, fontSize: '9px' }, y: 14 }
      },
      yAxis: {
        title: { text: undefined },
        gridLineWidth: 0,
        labels: { enabled: false },
        min: 0
      },
      tooltip: {
        backgroundColor: tooltipBg,
        style: { color: tooltipText, fontSize: '11px' },
        borderWidth: 1,
        borderRadius: 8,
        useHTML: true,
        formatter: function () {
          const v = (this as any).y || 0;
          return `<div style="font-weight:600">${(this as any).x}</div><div>RM ${v.toLocaleString()}</div>`;
        }
      },
      plotOptions: {
        column: {
          borderRadius: 5,
          borderWidth: 0,
          pointPadding: 0.1,
          groupPadding: 0.05,
          maxPointWidth: 14,
          cursor: 'pointer',
          point: {
            events: {
              click: function () {
                onSelect((this as any).index);
              }
            }
          },
          states: {
            hover: { brightness: 0.1 },
            inactive: { opacity: 1 }
          }
        }
      },
      series: [{
        type: 'column',
        name: 'Net Payroll',
        data: rows.map((r, i) => ({
          y: r.total,
          color: isHighlighted(i, r) ? activeColor : inactiveColor
        }))
      }]
    };
  });

  getTimeAgo(time: string): string {
    if (!time) return '';
    const now = new Date();
    const then = new Date(time);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }

  formatLastUpdated(): string {
    if (!this.lastUpdated) return '';
    const d = new Date(this.lastUpdated);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Not Started': 'badge-light-warning',
      'In Progress': 'badge-light-info',
      'Draft': 'badge-light-secondary',
      'Pending': 'badge-light-warning',
      'Approved': 'badge-light-success',
      'Paid': 'badge-light-success',
      'Manager Approved': 'badge-light-info',
      'Rejected': 'badge-light-danger'
    };
    return statusMap[status] || 'badge-light-secondary';
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
