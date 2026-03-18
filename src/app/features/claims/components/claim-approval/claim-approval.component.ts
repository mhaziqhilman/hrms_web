import { Component, OnInit, signal, computed, ViewContainerRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClaimService } from '../../services/claim.service';
import { Claim, ClaimQueryParams } from '../../models/claim.model';
import { AuthService } from '@/core/services/auth.service';
import { DisplayService } from '@/core/services/display.service';

// ZardUI Components
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardAvatarComponent } from '@/shared/components/avatar/avatar.component';
import { ZardMenuImports } from '@/shared/components/menu/menu.imports';
import { ZardDialogService } from '@/shared/components/dialog/dialog.service';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';
import { ZardSegmentedComponent, SegmentedOption } from '@/shared/components/segmented/segmented.component';
import { ZardTableImports } from '@/shared/components/table/table.imports';
import { ZardDividerComponent } from '@/shared/components/divider/divider.component';

// Dialog Components
import { ApprovalConfirmationDialogComponent } from './dialogs/approval-confirmation-dialog.component';
import { RejectionDialogComponent } from './dialogs/rejection-dialog.component';
import { PaymentDialogComponent } from './dialogs/payment-dialog.component';

@Component({
  selector: 'app-claim-approval',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardAvatarComponent,
    ZardMenuImports,
    ZardCheckboxComponent,
    ZardSegmentedComponent,
    ZardTableImports,
    ZardDividerComponent
  ],
  templateUrl: './claim-approval.component.html',
  styleUrl: './claim-approval.component.css'
})
export class ClaimApprovalComponent implements OnInit {
  private dialogService = inject(ZardDialogService);
  private alertDialogService = inject(ZardAlertDialogService);
  private viewContainerRef = inject(ViewContainerRef);
  private authService = inject(AuthService);
  private displayService = inject(DisplayService);

  claims = signal<Claim[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  processingClaimId = signal<number | null>(null);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalRecords = signal(0);
  limit = 10;

  // Filters
  activeTab = signal<string>('All');
  statusCounts = signal<{ [key: string]: number }>({
    'All': 0,
    'Pending': 0,
    'Manager_Approved': 0,
    'Finance_Approved': 0,
    'Paid': 0,
    'Rejected': 0
  });

  searchQuery = signal<string>('');
  selectedStatus = signal<'Pending' | 'Manager_Approved' | 'Finance_Approved' | 'Rejected' | 'Paid' | ''>('');
  selectedClaimType = signal<number | null>(null);

  // Status segmented filter options (computed based on role)
  statusOptions = computed(() => {
    const base: SegmentedOption[] = [
      { value: 'All', label: 'All' },
      { value: 'Pending', label: 'Pending' },
      { value: 'Manager Approved', label: 'Manager Approved' },
    ];
    if (this.isAdmin()) {
      base.push(
        { value: 'Finance Approved', label: 'Finance Approved' },
        { value: 'Paid', label: 'Paid' },
      );
    }
    base.push({ value: 'Rejected', label: 'Rejected' });
    return base;
  });

  // Column visibility
  visibleColumns = signal<{[key: string]: boolean}>({
    employee: true,
    claimType: true,
    date: true,
    amount: true,
    status: true
  });

  columnList = [
    { key: 'employee', label: 'Employee' },
    { key: 'claimType', label: 'Claim Type' },
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' }
  ];

  // Sort column mapping (frontend key → backend field)
  private sortColumnMap: Record<string, string> = {
    date: 'date',
    amount: 'amount',
    status: 'status'
  };

  // Sorting
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');

  // Selection
  selectedItems = signal<Set<number>>(new Set());
  selectAll = signal<boolean>(false);


  // User role from auth service
  userRole = signal<string>('staff');
  userId = signal<number | null>(null);

  // Admin/super_admin can handle all approval levels; manager only Level 1
  isAdmin = computed(() => ['admin', 'super_admin'].includes(this.userRole()));
  isManagerOrAbove = computed(() => ['manager', 'admin', 'super_admin'].includes(this.userRole()));

  // Expose Math to template
  Math = Math;

  constructor(private claimService: ClaimService) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUserValue();
    if (user) {
      this.userRole.set(user.role);
      this.userId.set(user.id);
    }
    this.loadClaims();
  }

  loadClaims(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: ClaimQueryParams = {
      page: this.currentPage(),
      limit: this.limit
    };

    // Filter based on user role
    if (this.selectedStatus()) {
      // User explicitly selected a status tab
      params.status = this.selectedStatus() as any;
    } else if (!this.isAdmin()) {
      // Managers only see Pending claims by default
      params.status = 'Pending';
    }
    // Admin/super_admin with no filter selected → see all claims

    if (this.selectedClaimType()) {
      params.claim_type_id = this.selectedClaimType()!;
    }

    if (this.sortColumn()) {
      (params as any).sort = this.sortColumnMap[this.sortColumn()];
      (params as any).order = this.sortDirection();
    }

    this.claimService.getAllClaims(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.claims.set(response.data);
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

  // Segmented status filter change
  onStatusSegmentChange(value: string): void {
    this.activeTab.set(value);

    // Map label to status value
    const statusMap: Record<string, string> = {
      'All': '',
      'Pending': 'Pending',
      'Manager Approved': 'Manager_Approved',
      'Finance Approved': 'Finance_Approved',
      'Paid': 'Paid',
      'Rejected': 'Rejected'
    };
    this.selectedStatus.set((statusMap[value] || '') as any);
    this.currentPage.set(1);
    this.loadClaims();
  }

  // Column visibility toggle
  toggleColumn(column: string): void {
    const current = this.visibleColumns();
    this.visibleColumns.set({
      ...current,
      [column]: !current[column]
    });
  }

  calculateStatusCounts(): void {
    // Note: In a real app, this should probably come from a separate API call 
    // to get counts for all statuses regardless of current filters
    // For now, we'll just init with 0 or map if the API provided it
    /* 
    const counts = { ...this.statusCounts() };
    counts['All'] = this.totalRecords();
    this.statusCounts.set(counts);
    */
  }

  // Sorting (API-side)
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

  // Selection Logic
  toggleSelectAll(): void {
    const allSelected = this.selectAll();
    const newSelection = new Set<number>();

    if (allSelected) {
      this.claims().forEach(claim => newSelection.add(claim.id));
    }

    this.selectedItems.set(newSelection);
  }

  toggleClaimSelection(claimId: number): void {
    const currentSelection = new Set(this.selectedItems()); // Create a copy
    if (currentSelection.has(claimId)) {
      currentSelection.delete(claimId);
    } else {
      currentSelection.add(claimId);
    }
    this.selectedItems.set(currentSelection);

    // Update selectAll state
    this.selectAll.set(
      this.claims().length > 0 &&
      currentSelection.size === this.claims().length
    );
  }

  isClaimSelected(claimId: number): boolean {
    return this.selectedItems().has(claimId);
  }

  getSelectedCount(): number {
    return this.selectedItems().size;
  }

  clearSelection(): void {
    this.selectedItems.set(new Set());
    this.selectAll.set(false);
  }

  bulkApprove(): void {
    const selectedIds = Array.from(this.selectedItems());
    if (selectedIds.length === 0) return;

    this.alertDialogService.confirm({
      zTitle: 'Bulk Approve',
      zDescription: `Are you sure you want to approve ${selectedIds.length} claims?`,
      zOkText: 'Approve All',
      zCancelText: 'Cancel',
      zOnOk: () => {
        // Implement bulk approval API call here
        // For now, we'll just simulate it or process one by one
        // ideally backend should support batch operations
        this.clearSelection();
        this.success.set(`${selectedIds.length} claims approved successfully`);
        setTimeout(() => this.success.set(null), 3000);
      }
    });
  }

  bulkReject(): void {
    const selectedIds = Array.from(this.selectedItems());
    if (selectedIds.length === 0) return;

    this.alertDialogService.confirm({
      zTitle: 'Bulk Reject',
      zDescription: `Are you sure you want to reject ${selectedIds.length} claims?`,
      zOkText: 'Reject All',
      zCancelText: 'Cancel',
      zOkDestructive: true,
      zOnOk: () => {
        this.clearSelection();
        this.success.set(`${selectedIds.length} claims rejected`);
        setTimeout(() => this.success.set(null), 3000);
      }
    });
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
    this.selectedStatus.set('');
    this.selectedClaimType.set(null);
    this.currentPage.set(1);
    this.loadClaims();
  }

  // Manager Approval Actions using Dialog Service
  openApprovalModal(claim: Claim): void {
    const dialogRef = this.dialogService.create({
      zTitle: 'Confirm Approval',
      zContent: ApprovalConfirmationDialogComponent,
      zData: claim,
      zViewContainerRef: this.viewContainerRef,
      zOkText: 'Confirm Approval',
      zCancelText: 'Cancel',
      zOkIcon: 'circle-check',
      zOnOk: () => {
        this.confirmApproval(claim);
      }
    });
  }

  openRejectionModal(claim: Claim): void {
    const dialogRef = this.dialogService.create({
      zTitle: 'Reject Claim',
      zContent: RejectionDialogComponent,
      zData: claim,
      zViewContainerRef: this.viewContainerRef,
      zOkText: 'Confirm Rejection',
      zCancelText: 'Cancel',
      zOkIcon: 'circle-x',
      zOkDestructive: true,
      zOnOk: (instance: RejectionDialogComponent): false | void => {
        const reason = instance.getRejectionReason();
        if (!reason.trim()) {
          this.error.set('Please provide a rejection reason');
          return false;
        }
        this.confirmRejection(claim, reason);
      }
    });
  }

  openPaymentModal(claim: Claim): void {
    const dialogRef = this.dialogService.create({
      zTitle: 'Record Payment',
      zContent: PaymentDialogComponent,
      zData: claim,
      zViewContainerRef: this.viewContainerRef,
      zOkText: 'Confirm Payment',
      zCancelText: 'Cancel',
      zOkIcon: 'circle',
      zOnOk: (instance: PaymentDialogComponent): false | void => {
        if (!instance.isValid()) {
          this.error.set('Please provide payment details');
          return false;
        }
        const paymentData = instance.getPaymentData();
        this.confirmPayment(claim, paymentData);
      }
    });
  }

  confirmApproval(claim: Claim): void {
    this.processingClaimId.set(claim.id);

    // Determine which API to call based on claim status
    const approval$ = claim.status === 'Pending'
      ? this.claimService.managerApproval(claim.public_id!, { action: 'approve' })
      : this.claimService.financeApproval(claim.public_id!, { action: 'approve' });

    const levelLabel = claim.status === 'Pending' ? 'Manager approval' : 'Finance approval';

    approval$.subscribe({
      next: (response) => {
        if (response.success) {
          this.success.set(`${levelLabel} completed successfully`);
          this.loadClaims();
          setTimeout(() => this.success.set(null), 3000);
        }
        this.processingClaimId.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to approve claim');
        this.processingClaimId.set(null);
        console.error('Error approving claim:', err);
      }
    });
  }

  confirmRejection(claim: Claim, reason: string): void {
    this.processingClaimId.set(claim.id);

    const request = {
      action: 'reject' as const,
      rejection_reason: reason
    };

    // Determine which API to call based on claim status
    const rejection$ = claim.status === 'Pending'
      ? this.claimService.managerApproval(claim.public_id!, request)
      : this.claimService.financeApproval(claim.public_id!, request);

    rejection$.subscribe({
      next: (response) => {
        if (response.success) {
          this.success.set('Claim rejected successfully');
          this.loadClaims();
          setTimeout(() => this.success.set(null), 3000);
        }
        this.processingClaimId.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to reject claim');
        this.processingClaimId.set(null);
        console.error('Error rejecting claim:', err);
      }
    });
  }

  // Finance Payment Actions
  confirmPayment(claim: Claim, paymentData: any): void {
    this.processingClaimId.set(claim.id);

    const request = {
      action: 'paid' as const,
      payment_method: paymentData.payment_method,
      payment_reference: paymentData.payment_reference,
      payment_date: paymentData.payment_date
    };

    this.claimService.financeApproval(claim.public_id!, request).subscribe({
      next: (response) => {
        if (response.success) {
          this.success.set('Payment recorded successfully');
          this.loadClaims();
          setTimeout(() => this.success.set(null), 3000);
        }
        this.processingClaimId.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to record payment');
        this.processingClaimId.set(null);
        console.error('Error recording payment:', err);
      }
    });
  }

  // Helper methods
  canApprove(claim: Claim): boolean {
    if (this.isAdmin()) {
      // Admin can approve Pending (Level 1) and Manager_Approved (Level 2)
      return claim.status === 'Pending' || claim.status === 'Manager_Approved';
    } else if (this.userRole() === 'manager') {
      // Manager can only approve Pending (Level 1)
      return claim.status === 'Pending';
    }
    return false;
  }

  canReject(claim: Claim): boolean {
    if (this.isAdmin()) {
      return claim.status === 'Pending' || claim.status === 'Manager_Approved';
    } else if (this.userRole() === 'manager') {
      return claim.status === 'Pending';
    }
    return false;
  }

  canMarkAsPaid(claim: Claim): boolean {
    return this.isAdmin() && claim.status === 'Finance_Approved';
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

  formatCurrency(amount: number | string | null | undefined): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
      return 'RM 0.00';
    }
    return `RM ${numAmount.toFixed(2)}`;
  }

  formatDate(dateString: string): string {
    return this.displayService.formatDate(dateString);
  }

  formatDateTime(dateString: string | null | undefined): string {
    return this.displayService.formatDateTime(dateString);
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
