import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LeaveService } from '../../services/leave.service';
import { LeaveRefreshService } from '../../services/leave-refresh.service';
import { LeaveFilterService } from '../../services/leave-filter.service';
import { AuthService } from '@/core/services/auth.service';
import { DisplayService } from '@/core/services/display.service';
import { Leave, LeaveStatus, LEAVE_TYPE_COLORS } from '../../models/leave.model';

import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';

interface BalanceTile {
  id: number;
  name: string;
  total: number;
  used: number;
  pending: number;
  balance: number;
  carry: number;
  isPaid: boolean;
  color: string;
  percentUsed: number;
}

interface MonthBucket {
  letter: string;
  month: number;
  weeks: number[];
  total: number;
}

@Component({
  selector: 'app-leave-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardSkeletonComponent,
    ZardEmptyComponent
  ],
  templateUrl: './leave-dashboard.component.html',
  styleUrl: './leave-dashboard.component.css'
})
export class LeaveDashboardComponent implements OnInit, OnDestroy {
  private leaveService = inject(LeaveService);
  private authService = inject(AuthService);
  private displayService = inject(DisplayService);
  private router = inject(Router);
  private refreshService = inject(LeaveRefreshService);
  private filters = inject(LeaveFilterService);
  private destroy$ = new Subject<void>();

  loading = signal(true);
  hasProfile = signal(true);
  error = signal<string | null>(null);

  balanceData = signal<any>(null);
  recentLeaves = signal<Leave[]>([]);

  // Filter state mirrors the shared service (read-only here)
  selectedEmployeeId = this.filters.selectedEmployeeId;
  selectedYear = this.filters.selectedYear;

  // Computed: build tiles from entitlements
  tiles = computed<BalanceTile[]>(() => {
    const data = this.balanceData();
    if (!data?.entitlements) return [];

    return data.entitlements.map((e: any) => {
      const total = e.total_days ?? 0;
      const used = e.used_days ?? 0;
      const pending = e.pending_days ?? 0;
      const balance = e.balance_days ?? 0;
      const percentUsed = total > 0 ? Math.round((used / total) * 100) : 0;
      return {
        id: e.leave_type.id,
        name: e.leave_type.name,
        total,
        used,
        pending,
        balance,
        carry: e.carry_forward_days ?? 0,
        isPaid: e.leave_type.is_paid,
        color: this.colorFor(e.leave_type.name),
        percentUsed
      } as BalanceTile;
    });
  });

  // Hero tile = "Annual Leave" if present, else first paid type, else first
  heroTile = computed<BalanceTile | null>(() => {
    const all = this.tiles();
    if (!all.length) return null;
    return (
      all.find((t) => /annual/i.test(t.name)) ||
      all.find((t) => t.isPaid) ||
      all[0]
    );
  });

  otherTiles = computed<BalanceTile[]>(() => {
    const hero = this.heroTile();
    return this.tiles().filter((t) => t.id !== hero?.id);
  });

  // Split for layout: first "other" tile is rendered before Recent activity,
  // the rest after — to match the design's 1:1 grid arrangement.
  firstOtherTile = computed<BalanceTile | null>(() => this.otherTiles()[0] ?? null);
  restOtherTiles = computed<BalanceTile[]>(() => this.otherTiles().slice(1));

  totalBalance = computed(() =>
    this.tiles().reduce((sum, t) => sum + t.balance, 0)
  );

  totalUsed = computed(() =>
    this.tiles().reduce((sum, t) => sum + t.used, 0)
  );

  totalPending = computed(() =>
    this.tiles().reduce((sum, t) => sum + t.pending, 0)
  );

  totalEntitled = computed(() =>
    this.tiles().reduce((sum, t) => sum + t.total, 0)
  );

  // Stacked bar segments for "Total balance"
  stackedSegments = computed(() => {
    const total = this.totalBalance();
    if (total === 0) return [];
    return this.tiles()
      .filter((t) => t.balance > 0)
      .map((t) => ({
        name: t.name,
        color: t.color,
        width: (t.balance / total) * 100
      }));
  });

  // Monthly heatmap from recent leaves (current year)
  monthlyHeatmap = computed<MonthBucket[]>(() => {
    const months: MonthBucket[] = Array.from({ length: 12 }, (_, i) => ({
      letter: 'JFMAMJJASOND'[i],
      month: i,
      weeks: [0, 0, 0, 0],
      total: 0
    }));

    const year = this.selectedYear();
    for (const lv of this.recentLeaves()) {
      if (lv.status !== LeaveStatus.APPROVED) continue;
      const start = new Date(lv.start_date);
      if (start.getFullYear() !== year) continue;
      const m = start.getMonth();
      const week = Math.min(3, Math.floor((start.getDate() - 1) / 7));
      months[m].weeks[week] += lv.total_days || 1;
      months[m].total += lv.total_days || 1;
    }
    return months;
  });

  peakMonth = computed(() => {
    const max = this.monthlyHeatmap().reduce(
      (acc, m) => (m.total > acc.total ? m : acc),
      { total: 0, month: 0 } as any
    );
    if (max.total === 0) return null;
    const date = new Date(this.selectedYear(), max.month, 1);
    return {
      label: date.toLocaleString('default', { month: 'long' }),
      days: max.total
    };
  });

  avgPerMonth = computed(() => {
    const total = this.totalUsed();
    return Math.round((total / 12) * 10) / 10;
  });

  recentActivity = computed(() => this.recentLeaves().slice(0, 4));

  carryForwardTotal = computed(() =>
    this.tiles().reduce((sum, t) => sum + t.carry, 0)
  );

  constructor() {
    // Reactively reload whenever the shared filter (employee or year) changes.
    effect(() => {
      const empId = this.filters.selectedEmployeeId();
      const year = this.filters.selectedYear();
      if (empId) this.loadAll(empId, year);
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUserValue();

    if (!user?.employee) {
      this.authService.getCurrentUser().subscribe({
        next: (res) => {
          if (res.success && res.data?.employee) {
            this.hasProfile.set(true);
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
    } else {
      this.hasProfile.set(true);
    }

    this.refreshService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const empId = this.filters.selectedEmployeeId();
        if (empId) this.loadAll(empId, this.filters.selectedYear());
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAll(empId: string, year: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.recentLeaves.set([]);

    this.leaveService.getLeaveBalance(empId, year).subscribe({
      next: (res) => {
        if (res.success) {
          this.balanceData.set(res.data);
          this.loadRecentLeaves(empId, year);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load leave balance');
        this.loading.set(false);
        console.error('Error loading balance:', err);
      }
    });
  }

  private loadRecentLeaves(employeePublicId: string | undefined, year: number): void {
    const params: any = {
      limit: 100,
      page: 1,
      start_date: `${year}-01-01`,
      end_date: `${year}-12-31`
    };
    if (employeePublicId) params.employee_id = employeePublicId;

    this.leaveService.getLeaves(params).subscribe({
      next: (res) => {
        if (res.success) this.recentLeaves.set(res.data.leaves || []);
      },
      error: (err) => console.error('Error loading recent leaves:', err)
    });
  }

  employeeInitials(name?: string | null): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  colorFor(name: string): string {
    return LEAVE_TYPE_COLORS[name] || '#64748b';
  }

  iconFor(name: string): string {
    const n = (name || '').toLowerCase();
    if (n.includes('medical') || n.includes('hospital') || n.includes('sick')) return 'heart';
    if (n.includes('emergency')) return 'alert-circle';
    if (n.includes('annual')) return 'sun';
    if (n.includes('unpaid')) return 'circle-x';
    if (n.includes('maternity') || n.includes('paternity')) return 'heart';
    if (n.includes('study')) return 'book-open';
    return 'activity';
  }

  sparkHeight(total: number): number {
    if (total <= 0) return 20;
    return Math.min(100, 30 + total * 12);
  }

  // Donut SVG calculations
  donutDashOffset(percent: number, circumference: number): number {
    const p = Math.max(0, Math.min(100, percent));
    return circumference * (1 - p / 100);
  }

  formatDate(d: string | Date): string {
    return this.displayService.formatDate(d);
  }

  formatShortDate(d: string | Date): string {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('default', { day: '2-digit', month: 'short' });
  }

  heatmapShade(weekValue: number): string {
    if (weekValue === 0) return 'bg-slate-100 dark:bg-slate-800';
    if (weekValue <= 2) return 'bg-slate-300 dark:bg-slate-600';
    return 'bg-slate-700 dark:bg-slate-400';
  }

  openApplyLeaveSheet(): void {
    this.refreshService.requestApply();
  }

  goToList(): void {
    this.router.navigate(['/leave/list']);
  }
}
