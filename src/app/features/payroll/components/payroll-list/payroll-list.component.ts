import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PayrollService } from '../../services/payroll.service';
import { Payroll, PayrollStatus, PayRun, PayRunStatus, MONTH_NAMES, PAYROLL_STATUS_COLORS, BulkActionResponse } from '../../models/payroll.model';

type DisplayPayRunStatus = PayRunStatus | 'Upcoming' | 'Delayed';
export interface DisplayPayRun extends Omit<PayRun, 'status'> {
  status: DisplayPayRunStatus;
  isPlaceholder?: boolean;   // No real pay run exists for this month (Upcoming/Delayed)
  canRunNow?: boolean;       // Should show the "Start Payroll" action
  // Legacy alias kept for incremental refactor; prefer isPlaceholder
  isDummy?: boolean;
}
import { AnalyticsService } from '../../../analytics/services/analytics.service';
import { PayrollCostAnalytics } from '../../../analytics/models/analytics.model';
import { forkJoin, Observable } from 'rxjs';

// ZardUI Component Imports
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardTooltipModule } from '@/shared/components/tooltip/tooltip';
import { ZardTableComponent } from '@/shared/components/table/table.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';
import { ZardFormFieldComponent } from '@/shared/components/form/form-field.component';
import { ZardFormLabelComponent } from '@/shared/components/form/form-label.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardTabGroupComponent, ZardTabComponent } from '@/shared/components/tabs/tabs.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardDialogService } from '@/shared/components/dialog/dialog.service';
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';
import { ZardSegmentedComponent, SegmentedOption } from '@/shared/components/segmented/segmented.component';
import { ZardSheetImports } from '@/shared/components/sheet/sheet.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { PayRunDialogComponent } from '../payrun-dialog/payrun-dialog.component';
import { PayrollSummaryChartComponent } from '../payroll-summary-chart/payroll-summary-chart.component';
import { QuickPayrollSheetComponent } from '../quick-payroll-sheet/quick-payroll-sheet.component';

@Component({
  selector: 'app-payroll-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ZardButtonComponent,
    ZardIconComponent,
    ZardCardComponent,
    ZardBadgeComponent,
    ZardTooltipModule,
    ZardTableComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardFormFieldComponent,
    ZardFormLabelComponent,
    ZardMenuImports,
    ZardTabGroupComponent,
    ZardTabComponent,
    ZardCheckboxComponent,
    ZardSegmentedComponent,
    ZardSheetImports,
    ZardDividerComponent,
    PayrollSummaryChartComponent,
    QuickPayrollSheetComponent
  ],
  templateUrl: './payroll-list.component.html',
  styleUrl: './payroll-list.component.css'
})
export class PayrollListComponent implements OnInit {
  private alertDialogService = inject(ZardAlertDialogService);
  private dialogService = inject(ZardDialogService);
  private analyticsService = inject(AnalyticsService);

  payrolls = signal<Payroll[]>([]);
  payrollAnalytics = signal<PayrollCostAnalytics | null>(null);
  loading = signal(false);
  loadingRuns = signal(false);
  error = signal<string | null>(null);

  // Main view tab
  activeViewTab = signal<'summary' | 'individual'>('summary');
  viewTabOptions: SegmentedOption[] = [
    { value: 'summary', label: 'Summary' },
    { value: 'individual', label: 'Individual' }
  ];

  // Selection (Individual tab)
  selectedPayrolls = signal<Set<string>>(new Set());
  selectAll = false;
  bulkProcessing = signal(false);

  // Pagination (Individual tab)
  currentPage = signal(1);
  totalPages = signal(1);
  limit = 10;
  total = signal(0);

  // Status tabs (Individual tab)
  activeTab = signal<PayrollStatus | 'All'>('All');
  statusCounts = signal<Record<string, number>>({
    All: 0,
    Draft: 0,
    Pending: 0,
    Approved: 0,
    Paid: 0,
    Cancelled: 0
  });

  // Filters
  selectedStatus = signal<PayrollStatus | ''>('');
  selectedYear = signal<number>(new Date().getFullYear());
  selectedMonth = signal<number | ''>('');
  searchEmployeeId = signal<string>('');

  // Column visibility (Individual tab)
  visibleColumns = signal<Record<string, boolean>>({
    employee: true,
    period: true,
    basicSalary: true,
    grossSalary: true,
    deductions: true,
    netSalary: true,
    status: true
  });

  // Sorting
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Constants
  PayrollStatus = PayrollStatus;
  MONTH_NAMES = MONTH_NAMES;
  PAYROLL_STATUS_COLORS = PAYROLL_STATUS_COLORS;
  Math = Math;

  // Generate year options
  years: number[] = [];

  // Pay runs loaded from database
  payRunsFromDb = signal<PayRun[]>([]);

  // Quick Payroll sheet (single-employee create/edit)
  quickPayrollSheetOpen = signal(false);
  quickPayrollEditId = signal<string | null>(null);

  // Pay Run detail sheet
  payRunSheetOpen = signal(false);
  selectedPayRun = signal<PayRun | null>(null);
  selectedPayRunPayrolls = signal<Payroll[]>([]);
  loadingPayRunDetail = signal(false);
  sendingAllPayslips = signal(false);

  // Toggle to show/hide cancelled payrolls in sheet
  showCancelledInSheet = signal(false);

  // Derived counts for sheet header
  cancelledPayrollCount = computed(() =>
    this.selectedPayRunPayrolls().filter(p => p.status === PayrollStatus.CANCELLED).length
  );
  activePayrollCount = computed(() =>
    this.selectedPayRunPayrolls().filter(p => p.status !== PayrollStatus.CANCELLED).length
  );

  // Visible payrolls (excludes cancelled unless toggled)
  visiblePayrunPayrolls = computed(() => {
    const all = this.selectedPayRunPayrolls();
    return this.showCancelledInSheet()
      ? all
      : all.filter(p => p.status !== PayrollStatus.CANCELLED);
  });

  // Computed: Pay Runs with display labels
  payRuns = computed<PayRun[]>(() => {
    return this.payRunsFromDb().map(run => {
      const monthName = MONTH_NAMES[run.month - 1];
      const lastDay = new Date(run.year, run.month, 0).getDate();
      return {
        ...run,
        key: `${run.year}-${String(run.month).padStart(2, '0')}`,
        label: `Run for ${monthName.slice(0, 3)} 1 - ${monthName.slice(0, 3)} ${lastDay}`
      };
    });
  });

  // Computed: real Pay Runs + placeholder rows for missing months (Delayed/Upcoming),
  // derived from current date vs the selected year's calendar.
  displayPayRuns = computed<DisplayPayRun[]>(() => {
    const real = this.payRuns();
    const selectedYear = this.selectedYear();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const byMonth = new Map<number, PayRun>();
    for (const r of real) {
      if (r.year === selectedYear) byMonth.set(r.month, r);
    }

    const placeholders: DisplayPayRun[] = [];
    const realInYear: DisplayPayRun[] = [];

    for (let m = 1; m <= 12; m++) {
      const existing = byMonth.get(m);
      if (existing) {
        realInYear.push({ ...existing, isPlaceholder: false });
        continue;
      }

      // Classify missing month relative to current date.
      // Future months ("Scheduled") are hidden — only Delayed + actionable Upcoming surface.
      let status: DisplayPayRunStatus;
      let canRunNow = false;
      if (selectedYear < currentYear) {
        status = 'Delayed';
        canRunNow = true;
      } else if (selectedYear > currentYear) {
        continue; // entire year is in the future
      } else if (m < currentMonth) {
        status = 'Delayed';
        canRunNow = true;
      } else if (m === currentMonth) {
        status = 'Upcoming';
        canRunNow = true;
      } else {
        continue; // future month within current year
      }

      const monthName = MONTH_NAMES[m - 1];
      const lastDay = new Date(selectedYear, m, 0).getDate();
      const paymentDate = `${selectedYear}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const key = `${selectedYear}-${String(m).padStart(2, '0')}`;

      placeholders.push({
        id: -m,
        public_id: `placeholder-${key}`,
        company_id: 0,
        month: m,
        year: selectedYear,
        pay_period_start: `${selectedYear}-${String(m).padStart(2, '0')}-01`,
        pay_period_end: paymentDate,
        payment_date: paymentDate,
        total_employees: 0,
        total_gross: 0,
        total_deductions: 0,
        total_net: 0,
        total_employer_cost: 0,
        status,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        key,
        label: `Run for ${monthName.slice(0, 3)} 1 - ${monthName.slice(0, 3)} ${lastDay}`,
        isPlaceholder: true,
        isDummy: true,
        canRunNow
      });
    }

    // Also keep real runs from other years (in case the signal ever contains them)
    const realOtherYears: DisplayPayRun[] = real
      .filter(r => r.year !== selectedYear)
      .map(r => ({ ...r, isPlaceholder: false }));

    // Sort priority: Delayed first (oldest → newest, most urgent up top),
    // then Upcoming (current month → future), then real runs (most recent first).
    const delayedRows = placeholders
      .filter(p => p.status === 'Delayed')
      .sort((a, b) => a.month - b.month);
    const upcomingRows = placeholders
      .filter(p => p.status === 'Upcoming')
      .sort((a, b) => a.month - b.month);
    const realRows = [...realInYear, ...realOtherYears]
      .sort((a, b) => (b.year - a.year) || (b.month - a.month));

    return [...delayedRows, ...upcomingRows, ...realRows];
  });

  // Count by display status, used by the Summary tab badges
  runStatusCounts = computed(() => {
    const counts: Record<DisplayPayRunStatus, number> = {
      'Delayed': 0, 'Upcoming': 0, 'Draft': 0, 'Pending': 0,
      'Approved': 0, 'Paid': 0, 'Cancelled': 0
    };
    for (const r of this.displayPayRuns()) {
      counts[r.status]++;
    }
    return counts;
  });

  // Computed: Upcoming payroll period
  upcomingPayroll = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Check if current month already has a pay run
    const runs = this.payRuns();
    const hasCurrentMonth = runs.some(r => r.month === currentMonth && r.year === currentYear);

    if (!hasCurrentMonth) {
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const endDate = new Date(currentYear, currentMonth - 1, lastDay);
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        label: 'UPCOMING PAYROLL',
        period: `${MONTH_NAMES[currentMonth - 1]} 1, ${currentYear} - ${MONTH_NAMES[currentMonth - 1]} ${lastDay}, ${currentYear}`,
        daysText: daysLeft > 0 ? `${daysLeft} DAYS LEFT` : 'DUE TODAY',
        isDelayed: false,
        month: currentMonth,
        year: currentYear
      };
    }
    return null;
  });

  // Computed: Pending/delayed payroll periods
  pendingPayrolls = computed(() => {
    const runs = this.payRuns();
    const now = new Date();
    const pending: Array<{
      label: string;
      period: string;
      daysText: string;
      isDelayed: boolean;
      month: number;
      year: number;
    }> = [];

    for (const run of runs) {
      if (run.status === 'Draft' || run.status === 'Pending') {
        const lastDay = new Date(run.year, run.month, 0).getDate();
        const endDate = new Date(run.year, run.month - 1, lastDay);
        const daysDiff = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
        const isDelayed = daysDiff > 0;

        pending.push({
          label: run.status === 'Draft' ? 'DRAFT PAYROLL' : 'PENDING PAYROLL',
          period: `${MONTH_NAMES[run.month - 1]} 1, ${run.year} - ${MONTH_NAMES[run.month - 1]} ${lastDay}, ${run.year}`,
          daysText: isDelayed ? `${daysDiff} DAYS DELAYED` : `${Math.abs(daysDiff)} DAYS LEFT`,
          isDelayed,
          month: run.month,
          year: run.year
        });
      }
    }

    return pending;
  });

  constructor(private payrollService: PayrollService) {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 3; i++) {
      this.years.push(currentYear - i);
    }
  }

  ngOnInit(): void {
    this.loadPayrolls();
    this.loadStatusCounts();
    this.loadAnalytics();
    this.loadAllPayrollsForRuns();
  }

  // Load pay runs from database
  loadAllPayrollsForRuns(): void {
    this.loadingRuns.set(true);
    this.payrollService.getPayRuns(this.selectedYear()).subscribe({
      next: (response) => {
        if (response.success) {
          this.payRunsFromDb.set(response.data);
        }
        this.loadingRuns.set(false);
      },
      error: () => {
        this.loadingRuns.set(false);
      }
    });
  }

  loadAnalytics(): void {
    const month = this.selectedMonth();
    const startMonth = typeof month === 'number' ? month : undefined;
    const endMonth = typeof month === 'number' ? month : undefined;

    this.analyticsService.getPayrollCostAnalytics(this.selectedYear(), startMonth, endMonth).subscribe({
      next: (response) => {
        if (response.success) {
          this.payrollAnalytics.set(response.data);
        }
      },
      error: (err) => {
        console.error('Payroll analytics error:', err);
      }
    });
  }

  loadStatusCounts(): void {
    const counts = {
      All: 0,
      Draft: 0,
      Pending: 0,
      Approved: 0,
      Paid: 0,
      Cancelled: 0
    };

    const year = this.selectedYear();

    this.payrollService.getPayrolls({ limit: 1, year }).subscribe({
      next: (response) => {
        if (response.success) {
          counts.All = response.data.pagination.total;
          this.statusCounts.set({ ...counts });
        }
      }
    });

    this.payrollService.getPayrolls({ status: PayrollStatus.DRAFT, limit: 1, year }).subscribe({
      next: (response) => {
        if (response.success) {
          counts.Draft = response.data.pagination.total;
          this.statusCounts.set({ ...counts });
        }
      }
    });

    this.payrollService.getPayrolls({ status: PayrollStatus.PENDING, limit: 1, year }).subscribe({
      next: (response) => {
        if (response.success) {
          counts.Pending = response.data.pagination.total;
          this.statusCounts.set({ ...counts });
        }
      }
    });

    this.payrollService.getPayrolls({ status: PayrollStatus.APPROVED, limit: 1, year }).subscribe({
      next: (response) => {
        if (response.success) {
          counts.Approved = response.data.pagination.total;
          this.statusCounts.set({ ...counts });
        }
      }
    });

    this.payrollService.getPayrolls({ status: PayrollStatus.PAID, limit: 1, year }).subscribe({
      next: (response) => {
        if (response.success) {
          counts.Paid = response.data.pagination.total;
          this.statusCounts.set({ ...counts });
        }
      }
    });

    this.payrollService.getPayrolls({ status: PayrollStatus.CANCELLED, limit: 1, year }).subscribe({
      next: (response) => {
        if (response.success) {
          counts.Cancelled = response.data.pagination.total;
          this.statusCounts.set({ ...counts });
        }
      }
    });
  }

  onViewTabChange(value: string): void {
    this.activeViewTab.set(value as 'summary' | 'individual');
  }

  onTabChange(event: { index: number; label: string }): void {
    const statusMap: Array<PayrollStatus | 'All'> = [
      'All',
      PayrollStatus.DRAFT,
      PayrollStatus.PENDING,
      PayrollStatus.APPROVED,
      PayrollStatus.PAID,
      PayrollStatus.CANCELLED
    ];

    const tab = statusMap[event.index];
    this.activeTab.set(tab);
    this.selectedStatus.set(tab === 'All' ? '' : tab);
    this.currentPage.set(1);
    this.clearSelection();

    if (tab === 'All') {
      this.selectedMonth.set('');
    }

    this.loadPayrolls();
  }

  loadPayrolls(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: any = {
      page: this.currentPage(),
      limit: this.limit
    };

    if (this.selectedStatus()) {
      params.status = this.selectedStatus();
    }
    params.year = this.selectedYear();
    if (this.selectedMonth()) {
      params.month = this.selectedMonth();
    }
    const searchValue = this.searchEmployeeId();
    if (searchValue && searchValue.trim() !== '') {
      params.search = searchValue;
    }

    this.payrollService.getPayrolls(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.payrolls.set(response.data.payrolls);
          this.currentPage.set(response.data.pagination.currentPage);
          this.totalPages.set(response.data.pagination.totalPages);
          this.total.set(response.data.pagination.total);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load payroll records');
        this.loading.set(false);
        console.error('Error loading payrolls:', err);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadPayrolls();
    this.loadAnalytics();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadPayrolls();
  }

  onGlobalYearChange(year: number): void {
    this.selectedYear.set(year);
    this.currentPage.set(1);
    this.clearSelection();
    this.loadPayrolls();
    this.loadStatusCounts();
    this.loadAnalytics();
    this.loadAllPayrollsForRuns();
  }

  onAnalyticsMonthChange(month: number | ''): void {
    this.selectedMonth.set(month);
    this.currentPage.set(1);
    this.loadPayrolls();
    this.loadAnalytics();
  }

  onMonthNavigate(direction: 1 | -1): void {
    const currentMonth = this.selectedMonth();
    if (currentMonth === '') {
      this.onAnalyticsMonthChange(direction === 1 ? 1 : 12);
    } else {
      const newMonth = (currentMonth as number) + direction;
      if (newMonth > 12 || newMonth < 1) {
        this.onAnalyticsMonthChange('');
      } else {
        this.onAnalyticsMonthChange(newMonth);
      }
    }
  }

  clearFilters(): void {
    this.selectedStatus.set('');
    this.selectedMonth.set('');
    this.searchEmployeeId.set('');
    this.currentPage.set(1);
    this.loadPayrolls();
    this.loadAnalytics();
  }

  getStatusBadgeClass(status: PayrollStatus): string {
    const classMap: Record<PayrollStatus, string> = {
      [PayrollStatus.DRAFT]: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
      [PayrollStatus.PENDING]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      [PayrollStatus.APPROVED]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      [PayrollStatus.PAID]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      [PayrollStatus.CANCELLED]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    return classMap[status] || '';
  }

  getRunStatusDotColor(status: DisplayPayRunStatus): string {
    const map: Record<DisplayPayRunStatus, string> = {
      'Paid': '#10b981',
      'Approved': '#3b82f6',
      'Pending': '#f59e0b',
      'Draft': '#94a3b8',
      'Cancelled': '#ef4444',
      'Upcoming': '#10b981',
      'Delayed': '#ef4444'
    };
    return map[status] || '#94a3b8';
  }

  getRunStatusBadgeClass(status: DisplayPayRunStatus): string {
    const classMap: Record<DisplayPayRunStatus, string> = {
      'Paid': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'Approved': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'Pending': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      'Draft': 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
      'Cancelled': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'Upcoming': 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
      'Delayed': 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
    };
    return classMap[status] || '';
  }

  getRunActionLabel(status: PayRunStatus): string {
    switch (status) {
      case 'Draft': return 'Review';
      case 'Pending': return 'Continue';
      case 'Approved': return 'View';
      case 'Paid': return 'View';
      case 'Cancelled': return 'View';
    }
  }

  getRunActionClass(status: PayRunStatus): string {
    switch (status) {
      case 'Draft': return 'bg-primary text-primary-foreground hover:bg-primary/90';
      case 'Pending': return 'bg-amber-600 text-white hover:bg-amber-700';
      case 'Approved': return '';
      case 'Paid': return '';
      case 'Cancelled': return '';
    }
  }

  getMonthName(month: number): string {
    return MONTH_NAMES[month - 1];
  }

  getSelectedMonthName(): string {
    const month = this.selectedMonth();
    return typeof month === 'number' ? MONTH_NAMES[month - 1] : 'Month';
  }

  formatCurrency(amount: number | string | null | undefined): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
      return 'RM 0.00';
    }
    return `RM ${numAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatShortDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatCheckDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  private toNum(val: number | string | null | undefined): number {
    if (val === null || val === undefined) return 0;
    const n = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(n) ? 0 : n;
  }

  // Employer statutory contributions (EPF + SOCSO + EIS employer portion).
  // Backend stores exactly this sum in total_employer_cost — gross is NOT included.
  getEmployerContribution(run: PayRun | DisplayPayRun): number {
    return this.toNum(run.total_employer_cost);
  }

  // Open pay run detail sheet
  viewPayRunDetails(run: PayRun): void {
    this.selectedPayRun.set(run);
    this.payRunSheetOpen.set(true);
    this.loadPayRunPayrolls(run.public_id);
  }

  closePayRunSheet(): void {
    this.payRunSheetOpen.set(false);
    this.showCancelledInSheet.set(false);
  }

  deletingPayRun = signal(false);

  deletePayRunFromRow(run: PayRun, event: Event): void {
    event.stopPropagation();
    this.selectedPayRun.set(run);
    this.deletePayRun(event);
  }

  deletePayRun(event: Event): void {
    event.stopPropagation();
    const run = this.selectedPayRun();
    if (!run) return;

    const isSoftCancel = run.status === 'Approved';
    const title = isSoftCancel ? 'Cancel Pay Run' : 'Delete Pay Run';
    const action = isSoftCancel ? 'cancel' : 'permanently delete';
    const impact = isSoftCancel
      ? `This will mark the pay run and all ${run.total_employees} linked payroll${run.total_employees > 1 ? 's' : ''} as <strong>Cancelled</strong>. The records will be preserved for audit.`
      : `This will <strong>permanently delete</strong> the pay run and all ${run.total_employees} linked payroll${run.total_employees > 1 ? 's' : ''}. This action cannot be undone.`;

    this.alertDialogService.confirm({
      zTitle: title,
      zDescription: `Are you sure you want to ${action} pay run for <strong>${run.label}</strong>? ${impact}`,
      zOkText: isSoftCancel ? 'Cancel Pay Run' : 'Delete',
      zCancelText: 'Keep',
      zOkDestructive: true,
      zOnOk: () => {
        this.deletingPayRun.set(true);
        this.payrollService.deletePayRun(run.public_id).subscribe({
          next: (res) => {
            this.deletingPayRun.set(false);
            this.alertDialogService.info({
              zTitle: 'Done',
              zDescription: res.message
            });
            this.closePayRunSheet();
            this.loadAllPayrollsForRuns();
            this.loadPayrolls();
            this.loadAnalytics();
          },
          error: (err) => {
            this.deletingPayRun.set(false);
            this.alertDialogService.info({
              zTitle: 'Error',
              zDescription: err?.error?.message || 'Failed to delete pay run'
            });
          }
        });
      }
    });
  }

  sendAllPayslips(event: Event): void {
    event.stopPropagation();
    const payrolls = this.selectedPayRunPayrolls();
    if (payrolls.length === 0) return;

    this.alertDialogService.confirm({
      zTitle: 'Send All Payslips',
      zDescription: `This will send payslip emails to all ${payrolls.length} employees in this pay run. Continue?`,
      zOkText: 'Send All',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.sendingAllPayslips.set(true);
        let completed = 0;
        let failed = 0;

        for (const p of payrolls) {
          this.payrollService.getPayslip(p.public_id!).subscribe({
            next: () => {
              completed++;
              if (completed + failed === payrolls.length) {
                this.sendingAllPayslips.set(false);
                this.alertDialogService.info({
                  zTitle: 'Payslips Sent',
                  zDescription: `Successfully sent ${completed} payslip${completed > 1 ? 's' : ''}${failed > 0 ? `. ${failed} failed.` : '.'}`
                });
              }
            },
            error: () => {
              failed++;
              if (completed + failed === payrolls.length) {
                this.sendingAllPayslips.set(false);
                this.alertDialogService.info({
                  zTitle: 'Payslips Sent',
                  zDescription: `Sent ${completed} payslip${completed > 1 ? 's' : ''}. ${failed} failed.`
                });
              }
            }
          });
        }
      }
    });
  }

  private loadPayRunPayrolls(publicId: string): void {
    this.loadingPayRunDetail.set(true);
    this.payrollService.getPayRunDetail(publicId).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedPayRunPayrolls.set(res.data.payrolls || []);
        }
        this.loadingPayRunDetail.set(false);
      },
      error: () => {
        this.loadingPayRunDetail.set(false);
      }
    });
  }

  getPayrollStatusClass(status: PayrollStatus): string {
    const map: Record<string, string> = {
      'Draft': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      'Pending': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      'Approved': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'Paid': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'Cancelled': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    return map[status] || '';
  }

  submitForApproval(payroll: Payroll): void {
    this.alertDialogService.confirm({
      zTitle: 'Submit for Approval',
      zDescription: `Are you sure you want to submit payroll for ${payroll.employee?.full_name} for approval?`,
      zOkText: 'Submit',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.payrollService.submitForApproval(payroll.public_id!).subscribe({
          next: (response) => {
            if (response.success) {
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Payroll submitted for approval successfully',
                zOkText: 'OK'
              });
              this.loadPayrolls();
              this.loadStatusCounts();
              this.loadAllPayrollsForRuns();
            }
          },
          error: (err) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: 'Failed to submit payroll for approval',
              zOkText: 'OK'
            });
            console.error('Error submitting payroll:', err);
          }
        });
      }
    });
  }

  approvePayroll(payroll: Payroll): void {
    this.alertDialogService.confirm({
      zTitle: 'Approve Payroll',
      zDescription: `Are you sure you want to approve payroll for ${payroll.employee?.full_name}?`,
      zOkText: 'Approve',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.payrollService.approvePayroll(payroll.public_id!).subscribe({
          next: (response) => {
            if (response.success) {
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Payroll approved successfully',
                zOkText: 'OK'
              });
              this.loadPayrolls();
              this.loadStatusCounts();
              this.loadAllPayrollsForRuns();
            }
          },
          error: (err) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: 'Failed to approve payroll',
              zOkText: 'OK'
            });
            console.error('Error approving payroll:', err);
          }
        });
      }
    });
  }

  markAsPaid(payroll: Payroll): void {
    this.alertDialogService.confirm({
      zTitle: 'Mark as Paid',
      zDescription: `Are you sure you want to mark this payroll as paid for ${payroll.employee?.full_name}?`,
      zOkText: 'Mark as Paid',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.payrollService.markAsPaid(payroll.public_id!).subscribe({
          next: (response) => {
            if (response.success) {
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Payroll marked as paid successfully',
                zOkText: 'OK'
              });
              this.loadPayrolls();
              this.loadStatusCounts();
              this.loadAllPayrollsForRuns();
            }
          },
          error: (err) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: 'Failed to mark payroll as paid',
              zOkText: 'OK'
            });
            console.error('Error marking payroll as paid:', err);
          }
        });
      }
    });
  }

  cancelPayroll(payroll: Payroll): void {
    this.alertDialogService.confirm({
      zTitle: 'Cancel Payroll',
      zDescription: `Are you sure you want to cancel this payroll for ${payroll.employee?.full_name}? This action cannot be undone.`,
      zOkText: 'Cancel Payroll',
      zCancelText: 'Go Back',
      zOkDestructive: true,
      zOnOk: () => {
        this.payrollService.cancelPayroll(payroll.public_id!).subscribe({
          next: (response) => {
            if (response.success) {
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Payroll cancelled successfully',
                zOkText: 'OK'
              });
              this.loadPayrolls();
              this.loadStatusCounts();
              this.loadAllPayrollsForRuns();
            }
          },
          error: (err) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: 'Failed to cancel payroll',
              zOkText: 'OK'
            });
            console.error('Error cancelling payroll:', err);
          }
        });
      }
    });
  }

  canEdit(payroll: Payroll): boolean {
    return payroll.status === PayrollStatus.DRAFT;
  }

  canSubmit(payroll: Payroll): boolean {
    return payroll.status === PayrollStatus.DRAFT;
  }

  canApprove(payroll: Payroll): boolean {
    return payroll.status === PayrollStatus.PENDING;
  }

  canMarkPaid(payroll: Payroll): boolean {
    return payroll.status === PayrollStatus.APPROVED;
  }

  canCancel(payroll: Payroll): boolean {
    return payroll.status === PayrollStatus.DRAFT || payroll.status === PayrollStatus.PENDING;
  }

  canDelete(payroll: Payroll): boolean {
    return payroll.status === PayrollStatus.CANCELLED;
  }

  deletePayroll(payroll: Payroll): void {
    this.alertDialogService.confirm({
      zTitle: 'Delete Payroll',
      zDescription: `Are you sure you want to permanently delete this payroll record for ${payroll.employee?.full_name}? This action cannot be undone.`,
      zOkText: 'Delete',
      zCancelText: 'Go Back',
      zOkDestructive: true,
      zOnOk: () => {
        this.payrollService.permanentDeletePayroll(payroll.public_id!).subscribe({
          next: (response) => {
            if (response.success) {
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Payroll permanently deleted successfully',
                zOkText: 'OK'
              });
              this.loadPayrolls();
              this.loadStatusCounts();
              this.loadAllPayrollsForRuns();
            }
          },
          error: (err) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: 'Failed to delete payroll',
              zOkText: 'OK'
            });
            console.error('Error deleting payroll:', err);
          }
        });
      }
    });
  }

  // Checkbox selection methods
  toggleSelectAll(): void {
    if (this.selectAll) {
      const newSelected = new Set(this.payrolls().map(p => p.public_id!));
      this.selectedPayrolls.set(newSelected);
    } else {
      this.selectedPayrolls.set(new Set());
      this.selectAll = false;
    }
  }

  togglePayrollSelection(payrollId: string): void {
    const selected = new Set(this.selectedPayrolls());

    if (selected.has(payrollId)) {
      selected.delete(payrollId);
    } else {
      selected.add(payrollId);
    }

    this.selectedPayrolls.set(selected);
    this.selectAll = selected.size === this.payrolls().length && this.payrolls().length > 0;
  }

  isPayrollSelected(payrollId: string): boolean {
    return this.selectedPayrolls().has(payrollId);
  }

  getSelectedCount(): number {
    return this.selectedPayrolls().size;
  }

  clearSelection(): void {
    this.selectedPayrolls.set(new Set());
    this.selectAll = false;
  }

  private executeBulkAction(actionName: string, serviceCall: Observable<BulkActionResponse>): void {
    this.bulkProcessing.set(true);

    serviceCall.subscribe({
      next: (response) => {
        this.bulkProcessing.set(false);
        const { successCount, failCount } = response.data;

        let description = `${successCount} payroll record(s) ${actionName} successfully.`;
        if (failCount > 0) {
          description += ` ${failCount} record(s) failed.`;
        }

        this.alertDialogService.info({
          zTitle: failCount > 0 ? 'Partial Success' : 'Success',
          zDescription: description,
          zOkText: 'OK'
        });

        this.clearSelection();
        this.loadPayrolls();
        this.loadStatusCounts();
        this.loadAllPayrollsForRuns();
      },
      error: (err) => {
        this.bulkProcessing.set(false);
        this.alertDialogService.warning({
          zTitle: 'Error',
          zDescription: `Failed to ${actionName} payrolls. Please try again.`,
          zOkText: 'OK'
        });
        console.error(`Error bulk ${actionName}:`, err);
      }
    });
  }

  getAvailableBulkActions(): { submit: boolean; approve: boolean; markPaid: boolean; cancel: boolean; delete: boolean } {
    const selectedIds = this.selectedPayrolls();
    const selectedPayrollObjects = this.payrolls().filter(p => selectedIds.has(p.public_id!));
    const statuses = new Set(selectedPayrollObjects.map(p => p.status));

    return {
      submit: statuses.size > 0 && [...statuses].every(s => s === PayrollStatus.DRAFT),
      approve: statuses.size > 0 && [...statuses].every(s => s === PayrollStatus.PENDING),
      markPaid: statuses.size > 0 && [...statuses].every(s => s === PayrollStatus.APPROVED),
      cancel: statuses.size > 0 && [...statuses].every(s => s === PayrollStatus.DRAFT || s === PayrollStatus.PENDING),
      delete: statuses.size > 0 && [...statuses].every(s => s === PayrollStatus.CANCELLED)
    };
  }

  bulkSubmit(): void {
    const selected = Array.from(this.selectedPayrolls());
    if (selected.length === 0) return;

    this.alertDialogService.confirm({
      zTitle: 'Bulk Submit for Approval',
      zDescription: `Are you sure you want to submit ${selected.length} payroll record(s) for approval?`,
      zOkText: 'Submit All',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.executeBulkAction('submitted', this.payrollService.bulkSubmitForApproval(selected));
      }
    });
  }

  bulkApprove(): void {
    const selected = Array.from(this.selectedPayrolls());
    if (selected.length === 0) return;

    this.alertDialogService.confirm({
      zTitle: 'Bulk Approve',
      zDescription: `Are you sure you want to approve ${selected.length} payroll record(s)?`,
      zOkText: 'Approve All',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.executeBulkAction('approved', this.payrollService.bulkApprovePayrolls(selected));
      }
    });
  }

  bulkMarkPaid(): void {
    const selected = Array.from(this.selectedPayrolls());
    if (selected.length === 0) return;

    this.alertDialogService.confirm({
      zTitle: 'Bulk Mark as Paid',
      zDescription: `Are you sure you want to mark ${selected.length} payroll record(s) as paid?`,
      zOkText: 'Mark All Paid',
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.executeBulkAction('marked as paid', this.payrollService.bulkMarkAsPaid(selected));
      }
    });
  }

  bulkCancel(): void {
    const selected = Array.from(this.selectedPayrolls());
    if (selected.length === 0) return;

    this.alertDialogService.confirm({
      zTitle: 'Bulk Cancel',
      zDescription: `Are you sure you want to cancel ${selected.length} payroll record(s)?`,
      zOkText: 'Cancel All',
      zCancelText: 'Go Back',
      zOkDestructive: true,
      zOnOk: () => {
        this.executeBulkAction('cancelled', this.payrollService.bulkCancelPayrolls(selected));
      }
    });
  }

  bulkDelete(): void {
    const selected = Array.from(this.selectedPayrolls());
    if (selected.length === 0) return;

    this.alertDialogService.confirm({
      zTitle: 'Bulk Delete',
      zDescription: `Are you sure you want to permanently delete ${selected.length} payroll record(s)? This action cannot be undone.`,
      zOkText: 'Delete All',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.executeBulkAction('deleted', this.payrollService.bulkPermanentDelete(selected));
      }
    });
  }

  toggleColumn(column: string): void {
    const columns = { ...this.visibleColumns() };
    columns[column] = !columns[column];
    this.visibleColumns.set(columns);
  }

  // ─── Pay Run bulk selection (Summary tab) ───
  selectedPayRuns = signal<Set<string>>(new Set());
  selectAllPayRuns = false;
  bulkPayRunProcessing = signal(false);

  private actionablePayRuns = computed(() =>
    this.displayPayRuns().filter(r =>
      !r.isPlaceholder && (r.status === 'Draft' || r.status === 'Pending' || r.status === 'Approved')
    )
  );

  isPayRunActionable(run: DisplayPayRun): boolean {
    return !run.isPlaceholder && (run.status === 'Draft' || run.status === 'Pending' || run.status === 'Approved');
  }

  togglePayRunSelection(publicId: string): void {
    const selected = new Set(this.selectedPayRuns());
    if (selected.has(publicId)) selected.delete(publicId);
    else selected.add(publicId);
    this.selectedPayRuns.set(selected);
    this.selectAllPayRuns = selected.size === this.actionablePayRuns().length && selected.size > 0;
  }

  isPayRunSelected(publicId: string): boolean {
    return this.selectedPayRuns().has(publicId);
  }

  toggleSelectAllPayRuns(): void {
    if (this.selectAllPayRuns) {
      this.selectedPayRuns.set(new Set(this.actionablePayRuns().map(r => r.public_id)));
    } else {
      this.selectedPayRuns.set(new Set());
    }
  }

  getSelectedPayRunCount(): number {
    return this.selectedPayRuns().size;
  }

  clearPayRunSelection(): void {
    this.selectedPayRuns.set(new Set());
    this.selectAllPayRuns = false;
  }

  getAvailablePayRunBulkActions(): { submit: boolean; approve: boolean; markPaid: boolean } {
    const ids = this.selectedPayRuns();
    const statuses = new Set(
      this.displayPayRuns().filter(r => ids.has(r.public_id)).map(r => r.status)
    );
    return {
      submit: statuses.size > 0 && [...statuses].every(s => s === 'Draft'),
      approve: statuses.size > 0 && [...statuses].every(s => s === 'Pending'),
      markPaid: statuses.size > 0 && [...statuses].every(s => s === 'Approved')
    };
  }

  bulkApprovePayRuns(): void {
    this.runBulkPayRunAction({
      title: 'Bulk Approve Pay Runs',
      actionLabel: 'Approve All',
      verb: 'approved',
      fromStatus: PayrollStatus.PENDING,
      call: (ids) => this.payrollService.bulkApprovePayrolls(ids)
    });
  }

  bulkSubmitPayRuns(): void {
    this.runBulkPayRunAction({
      title: 'Bulk Submit Pay Runs',
      actionLabel: 'Submit All',
      verb: 'submitted',
      fromStatus: PayrollStatus.DRAFT,
      call: (ids) => this.payrollService.bulkSubmitForApproval(ids)
    });
  }

  bulkMarkPayRunsPaid(): void {
    this.runBulkPayRunAction({
      title: 'Bulk Mark Pay Runs as Paid',
      actionLabel: 'Mark Paid',
      verb: 'marked as paid',
      fromStatus: PayrollStatus.APPROVED,
      call: (ids) => this.payrollService.bulkMarkAsPaid(ids)
    });
  }

  // Single pay-run helpers (used by row menu + sheet header)
  submitPayRunAction(runId: string): void {
    this.runBulkPayRunAction({
      title: 'Submit Pay Run',
      actionLabel: 'Submit',
      verb: 'submitted',
      fromStatus: PayrollStatus.DRAFT,
      call: (ids) => this.payrollService.bulkSubmitForApproval(ids),
      runIds: [runId]
    });
  }

  approvePayRunAction(runId: string): void {
    this.runBulkPayRunAction({
      title: 'Approve Pay Run',
      actionLabel: 'Approve',
      verb: 'approved',
      fromStatus: PayrollStatus.PENDING,
      call: (ids) => this.payrollService.bulkApprovePayrolls(ids),
      runIds: [runId]
    });
  }

  markPayRunPaidAction(runId: string): void {
    this.runBulkPayRunAction({
      title: 'Mark Pay Run as Paid',
      actionLabel: 'Mark Paid',
      verb: 'marked as paid',
      fromStatus: PayrollStatus.APPROVED,
      call: (ids) => this.payrollService.bulkMarkAsPaid(ids),
      runIds: [runId]
    });
  }

  private runBulkPayRunAction(opts: {
    title: string;
    actionLabel: string;
    verb: string;
    fromStatus: PayrollStatus;
    call: (payrollIds: string[]) => Observable<BulkActionResponse>;
    runIds?: string[];
  }): void {
    const runIds = opts.runIds ?? Array.from(this.selectedPayRuns());
    if (runIds.length === 0) return;

    this.alertDialogService.confirm({
      zTitle: opts.title,
      zDescription: `This will process all <strong>${opts.fromStatus}</strong> payrolls inside ${runIds.length} pay run${runIds.length > 1 ? 's' : ''}. Continue?`,
      zOkText: opts.actionLabel,
      zCancelText: 'Cancel',
      zOnOk: () => {
        this.bulkPayRunProcessing.set(true);

        forkJoin(runIds.map(id => this.payrollService.getPayRunDetail(id))).subscribe({
          next: (responses) => {
            const payrollIds: string[] = [];
            for (const res of responses) {
              if (res.success && res.data.payrolls) {
                for (const p of res.data.payrolls) {
                  if (p.status === opts.fromStatus && p.public_id) {
                    payrollIds.push(p.public_id);
                  }
                }
              }
            }

            if (payrollIds.length === 0) {
              this.bulkPayRunProcessing.set(false);
              this.alertDialogService.info({
                zTitle: 'Nothing to Process',
                zDescription: `No ${opts.fromStatus} payrolls found in the selected pay runs.`,
                zOkText: 'OK'
              });
              return;
            }

            opts.call(payrollIds).subscribe({
              next: (response) => {
                this.bulkPayRunProcessing.set(false);
                const { successCount, failCount } = response.data;
                this.alertDialogService.info({
                  zTitle: failCount > 0 ? 'Partial Success' : 'Success',
                  zDescription: `${successCount} payroll${successCount !== 1 ? 's' : ''} ${opts.verb} across ${runIds.length} pay run${runIds.length > 1 ? 's' : ''}${failCount > 0 ? `. ${failCount} failed.` : '.'}`,
                  zOkText: 'OK'
                });
                this.clearPayRunSelection();
                this.loadAllPayrollsForRuns();
                this.loadPayrolls();
                this.loadStatusCounts();
                // If the sheet is open for an affected run, refresh its payrolls
                const openId = this.selectedPayRun()?.public_id;
                if (openId && runIds.includes(openId)) {
                  this.loadPayRunPayrolls(openId);
                }
              },
              error: (err) => {
                this.bulkPayRunProcessing.set(false);
                this.alertDialogService.warning({
                  zTitle: 'Error',
                  zDescription: `Failed to ${opts.verb.replace(/ed$/, '')} pay runs. Please try again.`,
                  zOkText: 'OK'
                });
                console.error('Bulk pay run action error:', err);
              }
            });
          },
          error: (err) => {
            this.bulkPayRunProcessing.set(false);
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: 'Failed to load pay run details.',
              zOkText: 'OK'
            });
            console.error('Pay run detail fetch error:', err);
          }
        });
      }
    });
  }

  // Sorting methods
  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.sortPayrolls();
  }

  sortPayrolls(): void {
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column) return;

    const sorted = [...this.payrolls()].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (column) {
        case 'employee':
          aValue = a.employee?.full_name?.toLowerCase() || '';
          bValue = b.employee?.full_name?.toLowerCase() || '';
          break;
        case 'period':
          aValue = a.year * 12 + a.month;
          bValue = b.year * 12 + b.month;
          break;
        case 'basicSalary':
          aValue = parseFloat(a.basic_salary?.toString() || '0');
          bValue = parseFloat(b.basic_salary?.toString() || '0');
          break;
        case 'grossSalary':
          aValue = parseFloat(a.gross_salary?.toString() || '0');
          bValue = parseFloat(b.gross_salary?.toString() || '0');
          break;
        case 'deductions':
          aValue = parseFloat(a.total_deductions?.toString() || '0');
          bValue = parseFloat(b.total_deductions?.toString() || '0');
          break;
        case 'netSalary':
          aValue = parseFloat(a.net_salary?.toString() || '0');
          bValue = parseFloat(b.net_salary?.toString() || '0');
          break;
        case 'status':
          aValue = a.status?.toLowerCase() || '';
          bValue = b.status?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    this.payrolls.set(sorted);
  }

  getSortIcon(column: string): 'chevrons-up-down' | 'chevron-up' | 'chevron-down' {
    if (this.sortColumn() !== column) return 'chevrons-up-down';
    return this.sortDirection() === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  isSortActive(column: string): boolean {
    return this.sortColumn() === column;
  }

  openQuickPayrollSheet(payrollPublicId: string | null = null): void {
    this.quickPayrollEditId.set(payrollPublicId);
    this.quickPayrollSheetOpen.set(true);
  }

  closeQuickPayrollSheet(): void {
    this.quickPayrollSheetOpen.set(false);
    this.quickPayrollEditId.set(null);
  }

  onQuickPayrollSaved(): void {
    this.loadPayrolls();
    this.loadAllPayrollsForRuns();
    this.loadAnalytics();
  }

  openPayRunDialog(prefill?: { year: number; month: number }): void {
    this.dialogService.create({
      zContent: PayRunDialogComponent,
      zHideFooter: true,
      zClosable: false,
      zMaskClosable: false,
      zWidth: '85vw',
      zCustomClasses: 'p-0 gap-0 overflow-hidden !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !max-w-[1280px] h-[90vh] !max-h-[100vh] rounded-xl',
      zData: {
        year: prefill?.year,
        month: prefill?.month,
        onSuccess: () => {
          this.loadPayrolls();
          this.loadAllPayrollsForRuns();
          this.loadAnalytics();
        }
      }
    });
  }
}
