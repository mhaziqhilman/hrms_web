import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

import { AuthService } from '@/core/services/auth.service';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { LeaveFormSheetComponent } from '../leave-form-sheet/leave-form-sheet.component';
import { LeaveRefreshService } from '../../services/leave-refresh.service';
import { LeaveFilterService } from '../../services/leave-filter.service';
import { LeaveService } from '../../services/leave.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { Leave, LeaveStatus } from '../../models/leave.model';

type LeaveTab = 'dashboard' | 'list' | 'calendar';

interface CalendarSummaryAvatar {
  initials: string;
  name: string;
  gradient: string;
}

interface CalendarSummary {
  outToday: CalendarSummaryAvatar[];
  outTodayCount: number;
  backTomorrowCount: number;
  upcomingWeekCount: number;
  peakDay: { dateLabel: string; count: number; percent: number } | null;
}

interface ListSummary {
  pending: number;
  approved: number;
  rejected: number;
  outToday: number;
}

@Component({
  selector: 'app-leave-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    OverlayModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ZardButtonComponent,
    ZardIconComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    LeaveFormSheetComponent
  ],
  templateUrl: './leave-page.component.html',
  styleUrl: './leave-page.component.css'
})
export class LeavePageComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private refreshService = inject(LeaveRefreshService);
  private employeeService = inject(EmployeeService);
  private leaveService = inject(LeaveService);
  filters = inject(LeaveFilterService);

  private destroy$ = new Subject<void>();

  isStaff = signal(false);
  activeTab = signal<LeaveTab>('dashboard');

  // Apply-leave sheet
  formSheetOpen = signal(false);

  // Picker UI state (local to the page)
  pickerOpen = signal(false);
  pickerSearch = signal('');
  pickerDept = signal<string>('all');
  pickerHighlight = signal(0);

  // Calendar tab status strip — raw approved leaves in the next ~30 days
  private calendarLeaves = signal<Leave[]>([]);
  summaryLoading = signal(false);

  // List tab KPI strip — raw leaves for the selected year (all statuses)
  private listLeaves = signal<Leave[]>([]);
  listSummaryLoading = signal(false);

  // Avatar gradient palette (deterministic pick keeps the same person same color across views)
  private gradients = [
    'from-violet-500 to-violet-700',
    'from-sky-500 to-sky-700',
    'from-rose-500 to-rose-700',
    'from-amber-500 to-amber-700',
    'from-emerald-500 to-emerald-700',
    'from-indigo-500 to-indigo-700',
    'from-fuchsia-500 to-fuchsia-700'
  ];

  readonly calendarSummary = computed<CalendarSummary>(() => {
    const leaves = this.calendarLeaves();
    const totalEmployees = Math.max(1, this.filters.employees().length);
    return this.buildCalendarSummary(leaves, totalEmployees);
  });

  readonly listSummary = computed<ListSummary>(() => {
    const today = this.toIsoDate(this.startOfToday());
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let outToday = 0;

    for (const l of this.listLeaves()) {
      if (l.status === LeaveStatus.PENDING) {
        pending++;
      } else if (l.status === LeaveStatus.APPROVED) {
        approved++;
        if (l.start_date <= today && l.end_date >= today) outToday++;
      } else if (l.status === LeaveStatus.REJECTED) {
        rejected++;
      }
    }

    return { pending, approved, rejected, outToday };
  });

  years: number[] = [];

  departmentChips = computed(() => {
    const list = this.filters.employees();
    const counts = new Map<string, number>();
    for (const e of list) {
      const d = (e.department || 'Unassigned').trim();
      counts.set(d, (counts.get(d) || 0) + 1);
    }
    return [
      { key: 'all', label: 'All', count: list.length },
      ...Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ key: label.toLowerCase(), label, count }))
    ];
  });

  filteredEmployees = computed(() => {
    const q = this.pickerSearch().trim().toLowerCase();
    const dept = this.pickerDept();
    return this.filters.employees().filter((e) => {
      if (dept !== 'all') {
        const d = (e.department || 'Unassigned').toLowerCase();
        if (d !== dept) return false;
      }
      if (!q) return true;
      const hay = [e.full_name, e.employee_id, e.position, e.department]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  });

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 3; i++) this.years.push(currentYear - i);

    const user = this.auth.getCurrentUserValue();
    this.isStaff.set(user?.role === 'staff');

    this.bootstrap(user);

    this.updateActiveTab();
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateActiveTab();
        this.maybeOpenApplyFromQuery();
      });

    this.maybeOpenApplyFromQuery();

    this.refreshService.applyRequested$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.openApply());

    // After any leave action (apply/approve/reject), refresh whichever summary
    // strip is currently visible.
    this.refreshService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.activeTab() === 'calendar') this.loadCalendarSummary();
        else if (this.activeTab() === 'list') this.loadListSummary();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private bootstrap(user: any): void {
    if (!user?.employee) {
      this.auth.getCurrentUser().subscribe({
        next: (res) => {
          if (res.success && res.data?.employee) this.setupEmployee(res.data);
        }
      });
      return;
    }
    this.setupEmployee(user);
  }

  private setupEmployee(user: any): void {
    const ownPublicId = user?.employee?.public_id ?? null;
    this.filters.setSelectedEmployeeId(ownPublicId);

    if (this.isStaff()) {
      if (user.employee) this.filters.setEmployees([user.employee]);
    } else {
      this.employeeService.getEmployees({ status: 'Active', limit: 100 }).subscribe({
        next: (res) => {
          if (res.success) this.filters.setEmployees(res.data.employees);
        }
      });
    }
  }

  private updateActiveTab(): void {
    const url = this.router.url.split('?')[0];
    let tab: LeaveTab = 'dashboard';
    if (url.includes('/leave/calendar')) tab = 'calendar';
    else if (url.includes('/leave/list')) tab = 'list';
    this.activeTab.set(tab);

    if (tab === 'calendar') this.loadCalendarSummary();
    else if (tab === 'list') this.loadListSummary();
  }

  private loadListSummary(): void {
    const year = this.filters.selectedYear();
    this.listSummaryLoading.set(true);
    this.leaveService
      .getLeaves({
        start_date: `${year}-01-01`,
        end_date: `${year}-12-31`,
        limit: 500,
        page: 1
      })
      .subscribe({
        next: (res) => {
          if (res.success) this.listLeaves.set(res.data.leaves || []);
          this.listSummaryLoading.set(false);
        },
        error: (err) => {
          console.error('List summary load failed:', err);
          this.listSummaryLoading.set(false);
        }
      });
  }

  private loadCalendarSummary(): void {
    const today = this.startOfToday();
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + 30);

    this.summaryLoading.set(true);
    this.leaveService
      .getLeaves({
        status: LeaveStatus.APPROVED,
        start_date: this.toIsoDate(today),
        end_date: this.toIsoDate(horizon),
        limit: 200,
        page: 1
      })
      .subscribe({
        next: (res) => {
          if (res.success) this.calendarLeaves.set(res.data.leaves || []);
          this.summaryLoading.set(false);
        },
        error: (err) => {
          console.error('Calendar summary load failed:', err);
          this.summaryLoading.set(false);
        }
      });
  }

  private buildCalendarSummary(leaves: Leave[], totalEmployees: number): CalendarSummary {
    const today = this.startOfToday();
    const todayStr = this.toIsoDate(today);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = this.toIsoDate(weekEnd);

    const outToday = leaves.filter(
      (l) => l.start_date <= todayStr && l.end_date >= todayStr
    );
    const backTomorrow = leaves.filter((l) => l.end_date === todayStr).length;
    const upcomingWeek = leaves.filter(
      (l) => l.start_date > todayStr && l.start_date <= weekEndStr
    ).length;

    // Peak day in the next 14 days (skip today itself — we already surface it above)
    let peakDay: CalendarSummary['peakDay'] = null;
    for (let i = 1; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      // Skip weekends — pile-ups there aren't operationally interesting
      const dow = d.getDay();
      if (dow === 0 || dow === 6) continue;
      const dStr = this.toIsoDate(d);
      const concurrent = leaves.filter(
        (l) => l.start_date <= dStr && l.end_date >= dStr
      ).length;
      const percent = Math.round((concurrent / totalEmployees) * 100);
      const isPeak = concurrent >= 3 || percent >= 30;
      if (isPeak && (!peakDay || percent > peakDay.percent)) {
        peakDay = {
          dateLabel: d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          }),
          count: concurrent,
          percent
        };
      }
    }

    const avatars = outToday.slice(0, 4).map((l) => {
      const name = l.employee?.full_name ?? '';
      return {
        initials: this.employeeInitials(name),
        name,
        gradient: this.gradientFor(name)
      };
    });

    return {
      outToday: avatars,
      outTodayCount: outToday.length,
      backTomorrowCount: backTomorrow,
      upcomingWeekCount: upcomingWeek,
      peakDay
    };
  }

  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private gradientFor(name: string): string {
    if (!name) return this.gradients[0];
    let hash = 0;
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) | 0;
    return this.gradients[Math.abs(hash) % this.gradients.length];
  }

  /** When arriving via /leave/<tab>?action=apply, auto-open the sheet and clear the param. */
  private maybeOpenApplyFromQuery(): void {
    const action =
      this.route.snapshot.queryParamMap.get('action') ??
      this.deepestQueryParam('action');
    if (action !== 'apply') return;

    setTimeout(() => this.openApply(), 0);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { action: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private deepestQueryParam(key: string): string | null {
    let snapshot = this.route.snapshot;
    while (snapshot.firstChild) snapshot = snapshot.firstChild;
    return snapshot.queryParamMap.get(key);
  }

  openApply(): void {
    this.formSheetOpen.set(true);
  }

  onSheetClose(open: boolean): void {
    this.formSheetOpen.set(open);
  }

  onSheetSaved(): void {
    this.refreshService.emit();
  }

  // ── Year selector ─────────────────────────────────────────────
  onYearChange(year: number): void {
    this.filters.setSelectedYear(year);
    if (this.activeTab() === 'list') this.loadListSummary();
  }

  // ── Bulk actions (delegated to leave-list via the filter service) ─
  requestBulkApprove(): void {
    if (this.filters.canBulkApprove()) this.filters.requestBulkAction('approve');
  }

  requestBulkReject(): void {
    if (this.filters.canBulkReject()) this.filters.requestBulkAction('reject');
  }

  requestClearSelection(): void {
    this.filters.requestBulkAction('clear');
  }

  private toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ── Employee picker ───────────────────────────────────────────
  togglePicker(): void {
    if (this.pickerOpen()) this.closePicker();
    else this.openPicker();
  }

  openPicker(): void {
    this.pickerSearch.set('');
    this.pickerDept.set('all');
    this.pickerHighlight.set(0);
    this.pickerOpen.set(true);
    setTimeout(() => {
      const input = document.getElementById('emp-picker-search') as HTMLInputElement | null;
      input?.focus();
    });
  }

  closePicker(): void {
    this.pickerOpen.set(false);
  }

  setPickerDept(key: string): void {
    this.pickerDept.set(key);
    this.pickerHighlight.set(0);
  }

  onPickerSearch(value: string): void {
    this.pickerSearch.set(value);
    this.pickerHighlight.set(0);
  }

  onPickerKeydown(event: KeyboardEvent): void {
    const list = this.filteredEmployees();
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closePicker();
      return;
    }
    if (!list.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.pickerHighlight.set((this.pickerHighlight() + 1) % list.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.pickerHighlight.set(
        (this.pickerHighlight() - 1 + list.length) % list.length
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = list[this.pickerHighlight()];
      if (target) this.selectEmployee(target.public_id);
    }
  }

  selectEmployee(publicId: string | undefined | null): void {
    if (!publicId || publicId === this.filters.selectedEmployeeId()) {
      this.closePicker();
      return;
    }
    this.filters.setSelectedEmployeeId(publicId);
    this.closePicker();
  }

  goToAllStaff(): void {
    this.closePicker();
    this.router.navigate(['/employees']);
  }

  daysSinceJoin(joinDate?: string): string {
    if (!joinDate) return '';
    const start = new Date(joinDate).getTime();
    if (isNaN(start)) return '';
    const days = Math.floor((Date.now() - start) / 86400000);
    if (days < 0) return '';
    if (days < 30) return `${days}d`;
    if (days < 365) return `${Math.floor(days / 30)}mo`;
    return `${Math.floor(days / 365)}y`;
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
}
