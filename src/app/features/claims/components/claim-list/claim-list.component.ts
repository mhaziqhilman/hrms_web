import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { ClaimService } from '../../services/claim.service';
import { AuthService } from '@/core/services/auth.service';
import { DisplayService } from '@/core/services/display.service';
import { Claim, ClaimAnalytics, ClaimQueryParams, ClaimType } from '../../models/claim.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardTableComponent } from '@/shared/components/table/table.component';
import { ZardEmptyComponent } from '@/shared/components/empty/empty.component';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';
import { ZardSkeletonComponent } from '@/shared/components/skeleton/skeleton.component';
import { ClaimFormSheetComponent } from '../claim-form-sheet/claim-form-sheet.component';
import { ClaimApprovalSheetComponent } from '../claim-approval-sheet/claim-approval-sheet.component';

@Component({
  selector: 'app-claim-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardAvatarComponent,
    ZardMenuImports,
    ZardCheckboxComponent,
    ZardTableComponent,
    ZardEmptyComponent,
    ZardDividerComponent,
    ZardSkeletonComponent,
    ClaimFormSheetComponent,
    ClaimApprovalSheetComponent
  ],
  templateUrl: './claim-list.component.html',
  styleUrl: './claim-list.component.css'
})
export class ClaimListComponent implements OnInit {
  private claimService = inject(ClaimService);
  private alertDialogService = inject(ZardAlertDialogService);
  private authService = inject(AuthService);
  private displayService = inject(DisplayService);

  claims = signal<Claim[]>([]);
  allData: Claim[] = [];
  loading = signal(false);
  hasProfile = signal(true);
  error = signal<string | null>(null);

  // Analytics
  analytics = signal<ClaimAnalytics | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalRecords = signal(0);
  limit = 10;

  // Density
  density = signal<'compact' | 'default' | 'comfortable'>('default');

  // Claim types (for category filter)
  claimTypes = signal<ClaimType[]>([]);

  // Status Tabs (dot color drives pill marker; icon is fallback for "All")
  activeTab = signal<string>('All');
  statusTabs: { key: string; label: string; icon?: string; dot?: string }[] = [
    { key: 'All', label: 'All Claims', icon: 'layers' },
    { key: 'Pending', label: 'Pending', dot: 'bg-amber-500' },
    { key: 'Manager_Approved', label: 'Manager Approved', dot: 'bg-indigo-500' },
    { key: 'Finance_Approved', label: 'Finance Approved', dot: 'bg-emerald-500' },
    { key: 'Paid', label: 'Paid', dot: 'bg-slate-500' },
    { key: 'Rejected', label: 'Rejected', dot: 'bg-rose-500' }
  ];

  // Sort options for dropdown
  sortOptions = [
    { key: 'date_desc', label: 'Newest first', column: 'date', direction: 'desc' as const },
    { key: 'date_asc', label: 'Oldest first', column: 'date', direction: 'asc' as const },
    { key: 'amount_desc', label: 'Highest amount', column: 'amount', direction: 'desc' as const },
    { key: 'amount_asc', label: 'Lowest amount', column: 'amount', direction: 'asc' as const }
  ];
  statusCounts = signal<{[key: string]: number}>({
    'All': 0,
    'Pending': 0,
    'Manager_Approved': 0,
    'Finance_Approved': 0,
    'Rejected': 0,
    'Paid': 0
  });

  // Filters
  searchQuery = signal<string>('');
  selectedStatus = signal<'Pending' | 'Manager_Approved' | 'Finance_Approved' | 'Rejected' | 'Paid' | ''>('');
  selectedClaimType = signal<number | null>(null);
  employeeIdFilter = signal<number | null>(null);
  startDate = signal<string>('');
  endDate = signal<string>('');
  minAmount = signal<number | null>(null);
  maxAmount = signal<number | null>(null);

  // Search debounce
  private searchInput$ = new Subject<string>();
  private destroyRef = inject(DestroyRef);

  // Sorting
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Selection
  selectAll = false;
  selectedClaims = signal<Set<number>>(new Set());

  // Column visibility (matches new design columns)
  visibleColumns = signal<{[key: string]: boolean}>({
    employee: true,
    description: true,
    amount: true,
    submitted: true,
    status: true
  });

  columnList = [
    { key: 'employee', label: 'Claimant' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'status', label: 'Status' }
  ];

  // Expose Math to template
  Math = Math;

  // Current month label (e.g. "May 2026")
  currentMonthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  ngOnInit(): void {
    this.loadClaimTypes();
    // Debounce search keystrokes (300ms) before hitting the API
    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.searchQuery.set(value);
        this.currentPage.set(1);
        this.loadClaims();
      });

    const user = this.authService.getCurrentUserValue();
    if (user?.employee) {
      this.hasProfile.set(true);
      this.loadClaims();
      this.loadAnalytics();
    } else {
      this.loading.set(true);
      this.authService.getCurrentUser().subscribe({
        next: (res) => {
          if (res.success && res.data?.employee) {
            this.hasProfile.set(true);
            this.loadClaims();
            this.loadAnalytics();
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
  }

  loadClaimTypes(): void {
    this.claimService.getAllClaimTypes().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.claimTypes.set(res.data.filter(t => t.is_active !== false));
        }
      },
      error: (err) => console.error('Error loading claim types:', err)
    });
  }

  setClaimType(id: number | null): void {
    this.selectedClaimType.set(id);
    this.onFilterChange();
  }

  getSelectedClaimTypeName(): string {
    const id = this.selectedClaimType();
    if (!id) return '';
    return this.claimTypes().find(t => t.id === id)?.name || '';
  }

  setDensity(d: 'compact' | 'default' | 'comfortable'): void {
    this.density.set(d);
  }

  setLimit(size: number): void {
    this.limit = size;
    this.currentPage.set(1);
    this.loadClaims();
  }

  rangeStart(): number {
    if (this.totalRecords() === 0) return 0;
    return (this.currentPage() - 1) * this.limit + 1;
  }

  rangeEnd(): number {
    return Math.min(this.currentPage() * this.limit, this.totalRecords());
  }

  // --- Sort dropdown ---
  setSort(opt: { column: string; direction: 'asc' | 'desc' }): void {
    this.sortColumn.set(opt.column);
    this.sortDirection.set(opt.direction);
    this.currentPage.set(1);
    this.loadClaims();
  }

  currentSortLabel(): string {
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (!col) return 'Newest first';
    return this.sortOptions.find(o => o.column === col && o.direction === dir)?.label || 'Newest first';
  }

  // --- Rates (KPI footers) ---
  rejectionRate(): string {
    const a = this.analytics();
    if (!a || a.status.total === 0) return '0.0%';
    return `${((a.status.rejected / a.status.total) * 100).toFixed(1)}%`;
  }

  approvalRate(): string {
    const a = this.analytics();
    if (!a || a.status.total === 0) return '0.0%';
    return `${((a.status.approved / a.status.total) * 100).toFixed(1)}%`;
  }

  percentChange(current: number, previous: number): number | null {
    if (previous === 0) return current === 0 ? 0 : null;
    return ((current - previous) / previous) * 100;
  }

  // --- Row helpers ---
  formatClaimId(id: number): string {
    return id.toString().padStart(4, '0');
  }

  getInitials(name: string): string {
    if (!name || name === '?') return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  private gradientTones = [
    'from-violet-500 to-violet-700',
    'from-amber-500 to-amber-700',
    'from-emerald-500 to-emerald-700',
    'from-rose-500 to-rose-700',
    'from-indigo-500 to-indigo-700',
    'from-cyan-500 to-cyan-700',
    'from-pink-500 to-pink-700'
  ];

  getGradientTone(name: string): string {
    if (!name) return this.gradientTones[0];
    let hash = 0;
    for (const c of name) hash = (hash + c.charCodeAt(0));
    return this.gradientTones[hash % this.gradientTones.length];
  }

  getCategoryTone(name?: string): string {
    if (!name) return 'bg-muted text-muted-foreground';
    const lower = name.toLowerCase();
    if (lower.includes('travel') || lower.includes('mileage') || lower.includes('transport')) return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300';
    if (lower.includes('meal') || lower.includes('food') || lower.includes('entertain')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
    if (lower.includes('office') || lower.includes('suppl') || lower.includes('station')) return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
    if (lower.includes('software') || lower.includes('tool') || lower.includes('subscript') || lower.includes('license')) return 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300';
    return 'bg-muted text-muted-foreground';
  }

  getCategoryShort(name?: string): string {
    if (!name) return 'Other';
    return name.split(/[\s&·\-,/]+/)[0] || name;
  }

  getRelativeTime(date: string | Date | undefined | null): string {
    if (!date) return '—';
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    if (diff < 0) return 'Just now';
    const min = Math.floor(diff / 60_000);
    const hr = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
    if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }

  getAging(claim: Claim): number {
    if (!claim.created_at) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(claim.created_at).getTime()) / 86_400_000));
  }

  getAgingTone(claim: Claim): string {
    const a = this.getAging(claim);
    if (a >= 5) return 'text-rose-600 dark:text-rose-400';
    if (a >= 3) return 'text-amber-600 dark:text-amber-400';
    return 'text-muted-foreground';
  }

  isBreaching(claim: Claim): boolean {
    return this.isInQueue(claim) && this.getAging(claim) > 5;
  }

  isInQueue(claim: Claim): boolean {
    return claim.status === 'Pending' || claim.status === 'Manager_Approved';
  }

  refresh(): void {
    this.loadClaims();
    this.loadAnalytics();
  }

  getStatusInfo(claim: Claim): { text: string; tone: string } {
    switch (claim.status) {
      case 'Pending':
        return { text: 'Pending manager', tone: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900' };
      case 'Manager_Approved':
        return { text: 'Pending finance', tone: 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900' };
      case 'Finance_Approved':
        return { text: 'Approved', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900' };
      case 'Paid':
        return { text: 'Paid', tone: 'bg-muted text-muted-foreground ring-border' };
      case 'Rejected':
        return { text: 'Rejected', tone: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900' };
      default:
        return { text: claim.status, tone: 'bg-muted text-muted-foreground ring-border' };
    }
  }

  canQuickApprove(claim: Claim): boolean {
    return claim.status === 'Pending' || claim.status === 'Manager_Approved';
  }

  exportClaims(): void {
    this.downloadCsv(this.claims(), 'claims.csv');
  }

  exportSelected(): void {
    const selectedIds = this.selectedClaims();
    const rows = this.claims().filter(c => selectedIds.has(c.id));
    this.downloadCsv(rows.length ? rows : this.claims(), 'claims-selected.csv');
  }

  private downloadCsv(rows: Claim[], filename: string): void {
    if (!rows.length) return;
    const header = ['ID', 'Claimant', 'Category', 'Description', 'Amount', 'Status', 'Submitted'];
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [header.join(',')];
    for (const c of rows) {
      lines.push([
        `CLM-${this.formatClaimId(c.id)}`,
        c.employee?.full_name || '',
        c.claimType?.name || '',
        c.description || '',
        c.amount,
        c.status,
        c.created_at
      ].map(esc).join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  loadAnalytics(): void {
    this.claimService.getClaimsAnalytics().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.analytics.set(res.data);
        }
      },
      error: (err) => console.error('Error loading analytics:', err)
    });
  }

  getChangeDiff(current: number, previous: number): number {
    return current - previous;
  }

  loadClaims(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: ClaimQueryParams = {
      page: this.currentPage(),
      limit: this.limit
    };

    if (this.activeTab() !== 'All') params.status = this.activeTab() as any;
    if (this.selectedStatus()) params.status = this.selectedStatus() as any;
    if (this.selectedClaimType()) params.claim_type_id = this.selectedClaimType()!;
    if (this.employeeIdFilter()) params.employee_id = this.employeeIdFilter()!;
    if (this.searchQuery().trim()) params.search = this.searchQuery().trim();
    if (this.startDate()) params.start_date = this.startDate();
    if (this.endDate()) params.end_date = this.endDate();
    if (this.minAmount() !== null) params.min_amount = this.minAmount()!;
    if (this.maxAmount() !== null) params.max_amount = this.maxAmount()!;
    if (this.sortColumn()) {
      params.sort = this.sortColumnMap[this.sortColumn()] as any;
      params.order = this.sortDirection();
    }

    this.claimService.getAllClaims(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.claims.set(response.data);
          this.allData = response.data;
          this.totalPages.set(response.pagination.totalPages);
          this.totalRecords.set(response.pagination.total);
          this.currentPage.set(response.pagination.page);
          if (response.status_counts) {
            this.statusCounts.set({ ...response.status_counts });
          }
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err.message || 'Failed to load claims');
        this.loading.set(false);
        console.error('Error loading claims:', err);
      }
    });
  }

  onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  setDateRange(start: string, end: string): void {
    this.startDate.set(start);
    this.endDate.set(end);
    this.currentPage.set(1);
    this.loadClaims();
  }

  setAmountRange(min: number | null, max: number | null): void {
    this.minAmount.set(min);
    this.maxAmount.set(max);
    this.currentPage.set(1);
    this.loadClaims();
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedClaimType()
      || this.searchQuery()
      || this.startDate()
      || this.endDate()
      || this.minAmount() !== null
      || this.maxAmount() !== null);
  }

  onTabChange(status: string): void {
    this.activeTab.set(status);
    this.currentPage.set(1);
    this.loadClaims();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadClaims();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadClaims();
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('');
    this.selectedClaimType.set(null);
    this.employeeIdFilter.set(null);
    this.startDate.set('');
    this.endDate.set('');
    this.minAmount.set(null);
    this.maxAmount.set(null);
    this.currentPage.set(1);
    this.loadClaims();
  }

  // Selection methods
  toggleSelectAll(): void {
    if (this.selectAll) {
      const allIds = new Set(this.claims().map(c => c.id));
      this.selectedClaims.set(allIds);
    } else {
      this.selectedClaims.set(new Set());
      this.selectAll = false;
    }
  }

  toggleClaimSelection(id: number): void {
    const selected = new Set(this.selectedClaims());
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectedClaims.set(selected);
    this.selectAll = selected.size === this.claims().length && this.claims().length > 0;
  }

  isClaimSelected(id: number): boolean {
    return this.selectedClaims().has(id);
  }

  getSelectedCount(): number {
    return this.selectedClaims().size;
  }

  clearSelection(): void {
    this.selectedClaims.set(new Set());
    this.selectAll = false;
  }

  // Bulk actions — call manager/finance approval per claim based on current status
  bulkApprove(): void {
    const selectedIds = Array.from(this.selectedClaims());
    const selectedClaims = this.claims().filter(c => selectedIds.includes(c.id) && this.canQuickApprove(c));
    if (selectedClaims.length === 0) {
      this.alertDialogService.warning({
        zTitle: 'No approvable selection',
        zDescription: 'Selected claims are not in an approvable state.',
        zOkText: 'OK'
      });
      return;
    }

    this.alertDialogService.confirm({
      zTitle: 'Approve Selected Claims',
      zDescription: `Approve ${selectedClaims.length} claim(s)? This will advance pending claims to the next stage.`,
      zOkText: 'Approve all',
      zCancelText: 'Cancel',
      zOnOk: () => this.runBulkApproval(selectedClaims, 'approve')
    });
  }

  bulkReject(): void {
    const selectedIds = Array.from(this.selectedClaims());
    const selectedClaims = this.claims().filter(c => selectedIds.includes(c.id) && this.canQuickApprove(c));
    if (selectedClaims.length === 0) {
      this.alertDialogService.warning({
        zTitle: 'No rejectable selection',
        zDescription: 'Selected claims are not in a rejectable state.',
        zOkText: 'OK'
      });
      return;
    }
    const reason = window.prompt(`Reject ${selectedClaims.length} claim(s).\n\nEnter rejection reason:`);
    if (reason === null) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      this.alertDialogService.warning({
        zTitle: 'Reason required',
        zDescription: 'A rejection reason is required.',
        zOkText: 'OK'
      });
      return;
    }
    this.runBulkApproval(selectedClaims, 'reject', trimmed);
  }

  private runBulkApproval(claims: Claim[], action: 'approve' | 'reject', reason?: string): void {
    const calls = claims.map(c => {
      if (c.status === 'Pending') {
        return this.claimService.managerApproval(c.public_id!, {
          action,
          ...(action === 'reject' ? { rejection_reason: reason } : {})
        });
      }
      // Manager_Approved → finance stage
      return this.claimService.financeApproval(c.public_id!, {
        action,
        ...(action === 'reject' ? { rejection_reason: reason } : {})
      });
    });

    forkJoin(calls).subscribe({
      next: () => {
        this.alertDialogService.info({
          zTitle: action === 'approve' ? 'Approved' : 'Rejected',
          zDescription: `${claims.length} claim(s) ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
          zOkText: 'OK'
        });
        this.clearSelection();
        this.loadClaims();
        this.loadAnalytics();
      },
      error: (err) => {
        console.error('Bulk action failed:', err);
        this.alertDialogService.warning({
          zTitle: 'Bulk action failed',
          zDescription: err?.error?.message || 'Some claims could not be processed.',
          zOkText: 'OK'
        });
        this.clearSelection();
        this.loadClaims();
      }
    });
  }

  // Inline row approve/reject — one-click with confirmation
  inlineApprove(claim: Claim, event: Event): void {
    event.stopPropagation();
    if (!this.canQuickApprove(claim) || !claim.public_id) return;
    const nextStage = claim.status === 'Pending' ? 'manager' : 'finance';
    this.alertDialogService.confirm({
      zTitle: `Approve as ${nextStage}`,
      zDescription: `Approve claim ${this.getInitials(claim.employee?.full_name || '')} · ${this.formatCurrency(claim.amount)}?`,
      zOkText: 'Approve',
      zCancelText: 'Cancel',
      zOnOk: () => {
        const call = claim.status === 'Pending'
          ? this.claimService.managerApproval(claim.public_id!, { action: 'approve' })
          : this.claimService.financeApproval(claim.public_id!, { action: 'approve' });
        call.subscribe({
          next: () => { this.loadClaims(); this.loadAnalytics(); },
          error: (err) => this.alertDialogService.warning({
            zTitle: 'Approval failed',
            zDescription: err?.error?.message || 'Could not approve the claim.',
            zOkText: 'OK'
          })
        });
      }
    });
  }

  inlineReject(claim: Claim, event: Event): void {
    event.stopPropagation();
    if (!this.canQuickApprove(claim) || !claim.public_id) return;
    const reason = window.prompt(`Reject claim from ${claim.employee?.full_name || 'employee'}.\n\nEnter rejection reason:`);
    if (reason === null) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      this.alertDialogService.warning({
        zTitle: 'Reason required',
        zDescription: 'A rejection reason is required.',
        zOkText: 'OK'
      });
      return;
    }
    const call = claim.status === 'Pending'
      ? this.claimService.managerApproval(claim.public_id, { action: 'reject', rejection_reason: trimmed })
      : this.claimService.financeApproval(claim.public_id, { action: 'reject', rejection_reason: trimmed });
    call.subscribe({
      next: () => { this.loadClaims(); this.loadAnalytics(); },
      error: (err) => this.alertDialogService.warning({
        zTitle: 'Rejection failed',
        zDescription: err?.error?.message || 'Could not reject the claim.',
        zOkText: 'OK'
      })
    });
  }

  // Sort column mapping (frontend key → backend field)
  private sortColumnMap: Record<string, string> = {
    date: 'date',
    amount: 'amount',
    status: 'status'
  };

  // Sorting methods (API-side)
  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
    this.loadClaims();
  }

  getSortIcon(column: string): 'chevrons-up-down' | 'chevron-up' | 'chevron-down' {
    if (this.sortColumn() !== column) return 'chevrons-up-down';
    return this.sortDirection() === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  isSortActive(column: string): boolean {
    return this.sortColumn() === column;
  }

  // Column visibility
  toggleColumn(column: string): void {
    const current = this.visibleColumns();
    this.visibleColumns.set({
      ...current,
      [column]: !current[column]
    });
  }

  getStatusBadgeType(status: string): string {
    const badgeMap: Record<string, string> = {
      'Pending': 'soft-yellow',
      'Manager_Approved': 'soft-blue',
      'Finance_Approved': 'soft-green',
      'Paid': 'soft-green',
      'Rejected': 'soft-red'
    };
    return badgeMap[status] || 'soft-gray';
  }

  getStatusDotClass(status: string): string {
    const dotMap: Record<string, string> = {
      'Pending': 'bg-yellow-500',
      'Manager_Approved': 'bg-blue-500',
      'Finance_Approved': 'bg-green-500',
      'Paid': 'bg-green-500',
      'Rejected': 'bg-red-500'
    };
    return dotMap[status] || 'bg-gray-400';
  }

  getStatusDisplayText(status: string): string {
    switch (status) {
      case 'Manager_Approved':
        return 'Manager Approved';
      case 'Finance_Approved':
        return 'Finance Approved';
      default:
        return status;
    }
  }

  formatDate(dateString: string | null | undefined): string {
    return this.displayService.formatDate(dateString);
  }

  formatDateTime(dateString: string | null | undefined): string {
    return this.displayService.formatDateTime(dateString);
  }

  formatCurrency(amount: number | string | null | undefined): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
      return 'RM 0.00';
    }
    return `RM ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  deleteClaim(id: number | string): void {
    this.alertDialogService.confirm({
      zTitle: 'Delete Claim',
      zDescription: 'Are you sure you want to delete this claim? This action cannot be undone.',
      zOkText: 'Delete',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.claimService.deleteClaim(id).subscribe({
          next: (response) => {
            if (response.success) {
              this.alertDialogService.info({
                zTitle: 'Success',
                zDescription: 'Claim deleted successfully',
                zOkText: 'OK'
              });
              this.loadClaims();
            }
          },
          error: (err: any) => {
            this.alertDialogService.warning({
              zTitle: 'Error',
              zDescription: err.error?.message || 'Failed to delete claim',
              zOkText: 'OK'
            });
            console.error('Error deleting claim:', err);
          }
        });
      }
    });
  }

  canDelete(claim: Claim): boolean {
    return claim.status === 'Pending';
  }

  canEdit(claim: Claim): boolean {
    return claim.status === 'Pending';
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: number[] = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, -1);
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < total - 1) {
      rangeWithDots.push(-1, total);
    } else if (total > 1) {
      rangeWithDots.push(total);
    }

    return rangeWithDots;
  }

  // Sheet state
  formSheetOpen = signal(false);
  formSheetClaimId = signal<string | null>(null);
  formSheetViewOnly = signal(false);
  approvalSheetOpen = signal(false);
  approvalSheetClaimId = signal<string | null>(null);

  openSubmitClaimSheet(): void {
    this.formSheetClaimId.set(null);
    this.formSheetViewOnly.set(false);
    this.formSheetOpen.set(true);
  }

  openEditClaimSheet(claim: Claim): void {
    this.formSheetClaimId.set(claim.public_id || null);
    this.formSheetViewOnly.set(false);
    this.formSheetOpen.set(true);
  }

  openViewClaimSheet(claim: Claim): void {
    // For pending claims, show approval sheet; for other statuses, show read-only form
    if (claim.status === 'Pending') {
      this.formSheetClaimId.set(claim.public_id || null);
      this.formSheetViewOnly.set(true);
      this.formSheetOpen.set(true);
    } else {
      this.approvalSheetClaimId.set(claim.public_id || null);
      this.approvalSheetOpen.set(true);
    }
  }

  onFormSheetClose(open: boolean): void {
    this.formSheetOpen.set(open);
    if (!open) {
      this.formSheetClaimId.set(null);
      this.formSheetViewOnly.set(false);
    }
  }

  onFormSheetSaved(): void {
    this.loadClaims();
  }

  onApprovalSheetClose(open: boolean): void {
    this.approvalSheetOpen.set(open);
    if (!open) {
      this.approvalSheetClaimId.set(null);
    }
  }

  onApprovalSheetAction(): void {
    this.loadClaims();
  }
}
