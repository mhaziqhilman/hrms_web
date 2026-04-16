import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClaimService } from '../../services/claim.service';
import { AuthService } from '@/core/services/auth.service';
import { DisplayService } from '@/core/services/display.service';
import { Claim, ClaimAnalytics, ClaimQueryParams } from '../../models/claim.model';

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
    ZardSkeletonComponent
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

  // Status Tabs
  activeTab = signal<string>('All');
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

  // Sorting
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Selection
  selectAll = false;
  selectedClaims = signal<Set<number>>(new Set());

  // Column visibility
  visibleColumns = signal<{[key: string]: boolean}>({
    employee: true,
    claimType: true,
    date: true,
    amount: true,
    status: true,
    approval: true
  });

  columnList = [
    { key: 'employee', label: 'Employee' },
    { key: 'claimType', label: 'Claim Type' },
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'approval', label: 'Approval' }
  ];

  // Expose Math to template
  Math = Math;

  ngOnInit(): void {
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

  getMaxTypeCount(): number {
    const types = this.analytics()?.by_type || [];
    return types.length ? Math.max(...types.map(t => t.count)) : 1;
  }

  loadClaims(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: ClaimQueryParams = {
      page: this.currentPage(),
      limit: this.limit
    };

    // Add active tab filter
    if (this.activeTab() !== 'All') {
      params.status = this.activeTab() as any;
    }

    // Add filters if set
    if (this.selectedStatus()) {
      params.status = this.selectedStatus() as any;
    }

    if (this.selectedClaimType()) {
      params.claim_type_id = this.selectedClaimType()!;
    }

    if (this.employeeIdFilter()) {
      params.employee_id = this.employeeIdFilter()!;
    }

    if (this.sortColumn()) {
      (params as any).sort = this.sortColumnMap[this.sortColumn()];
      (params as any).order = this.sortDirection();
    }

    this.claimService.getAllClaims(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.claims.set(response.data);
          this.allData = response.data;
          this.totalPages.set(response.pagination.totalPages);
          this.totalRecords.set(response.pagination.total);
          this.currentPage.set(response.pagination.page);
          this.calculateStatusCounts();
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

  calculateStatusCounts(): void {
    const counts: {[key: string]: number} = {
      'All': this.allData.length,
      'Pending': 0,
      'Manager_Approved': 0,
      'Finance_Approved': 0,
      'Rejected': 0,
      'Paid': 0
    };

    this.allData.forEach(claim => {
      if (counts[claim.status] !== undefined) {
        counts[claim.status]++;
      }
    });

    this.statusCounts.set(counts);
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

  // Bulk actions
  bulkApprove(): void {
    const selected = Array.from(this.selectedClaims());
    if (selected.length === 0) {
      this.alertDialogService.warning({
        zTitle: 'No Selection',
        zDescription: 'Please select claims to approve',
        zOkText: 'OK'
      });
      return;
    }

    this.alertDialogService.confirm({
      zTitle: 'Approve Selected Claims',
      zDescription: `Are you sure you want to approve ${selected.length} claim(s)?`,
      zOkText: 'Approve All',
      zCancelText: 'Cancel',
      zOnOk: () => {
        // Implement bulk approve logic
        this.clearSelection();
        this.loadClaims();
      }
    });
  }

  bulkDelete(): void {
    const selected = Array.from(this.selectedClaims());
    if (selected.length === 0) {
      this.alertDialogService.warning({
        zTitle: 'No Selection',
        zDescription: 'Please select claims to delete',
        zOkText: 'OK'
      });
      return;
    }

    this.alertDialogService.confirm({
      zTitle: 'Delete Selected Claims',
      zDescription: `Are you sure you want to delete ${selected.length} claim(s)? This action cannot be undone.`,
      zOkText: 'Delete All',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        // Implement bulk delete logic
        this.clearSelection();
        this.loadClaims();
      }
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

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'badge-warning';
      case 'Manager_Approved':
        return 'badge-info';
      case 'Finance_Approved':
        return 'badge-primary';
      case 'Paid':
        return 'badge-success';
      case 'Rejected':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
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
    return `RM ${numAmount.toFixed(2)}`;
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
}
